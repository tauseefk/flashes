import Peer, { DataConnection } from 'peerjs';
import type { GameMap } from './state';

enum Role {
  Player = 'Player',
  Spectator = 'Spectator',
}

export interface ConnectionInfo {
  role: Role;
  map: GameMap;
  clientId: string;
}

export enum ServerMessageType {
  ClientAcknowledged = 'ClientAcknowledged',
  PeerJoined = 'PeerJoined',
}

interface ClientAcknowledgedMessage {
  type: ServerMessageType.ClientAcknowledged;
  role: Role;
  map: GameMap;
  clientId: string;
}

interface PeerJoinedMessage {
  type: ServerMessageType.PeerJoined;
  peerId: string;
}

export enum ClientMessage {
  ClientJoined = 'ClientJoined',
}

interface ClientJoinedMessage {
  type: ClientMessage.ClientJoined;
}

export enum P2PMessageType {
  InitialStateVector = 'InitialStateVector',
  Delta = 'Delta',
}

export interface InitialStateVectorMessage {
  type: P2PMessageType.InitialStateVector;
  data: Uint8Array;
}

export interface DeltaMessage {
  type: P2PMessageType.Delta;
  data: Uint8Array;
}

type ServerMessage = ClientAcknowledgedMessage | PeerJoinedMessage;
type P2PMessage = InitialStateVectorMessage | DeltaMessage;

export class PeerConnectionManager {
  peerConnectionStatus: 'Waiting' | 'Connected' | 'Disconnected' = 'Waiting';
  private serverConnection!: WebSocket;
  private peerjs: Peer | undefined;
  private p2pConnection: DataConnection | null = null;
  private role: Role | undefined;
  private clientId: string | undefined;

  private serverStreamController: ReadableStreamDefaultController<ServerMessage> | null =
    null;
  serverStream: ReadableStream<ServerMessage>;

  private peerStreamController: ReadableStreamDefaultController<P2PMessage> | null =
    null;
  peerStream: ReadableStream<P2PMessage>;

  constructor() {
    this.serverStream = new ReadableStream<ServerMessage>({
      start: (controller) => {
        this.serverStreamController = controller;
      },
    });
    this.peerStream = new ReadableStream<P2PMessage>({
      start: (controller) => {
        this.peerStreamController = controller;
      },
    });
  }

  async connect(): Promise<void> {
    this.serverConnection = new WebSocket(SERVER_URL);

    const joinMessage: ClientJoinedMessage = {
      type: ClientMessage.ClientJoined,
    };

    return new Promise((resolve, reject) => {
      this.serverConnection.onopen = () => {
        this.serverConnection.send(JSON.stringify(joinMessage));
        resolve();
      };

      this.serverConnection.onmessage = async (event) => {
        const message = JSON.parse(event.data) as ServerMessage;
        if (this.serverStreamController) {
          this.serverStreamController.enqueue({
            ...(message as ServerMessage),
          });
        }

        switch (message.type) {
          case ServerMessageType.ClientAcknowledged:
            this.clientId = message.clientId;
            this.role = message.role;
            break;
          case ServerMessageType.PeerJoined:
            if (this.role === 'Player') this.peerConnectionStatus = 'Connected';
            await this.initializePeerConnection(message.peerId);
            break;
        }
      };

      this.serverConnection.onerror = (error) => {
        console.error('WebSocket error:', error);
        reject(error);
      };

      this.serverConnection.onclose = () => {
        if (this.serverStreamController) {
          this.serverStreamController.close();
        }
      };
    });
  }

  // closes the connection to the server
  // ideally after P2P connection with the peer has been established
  closeServerConnection() {
    this.serverStreamController?.close();
    this.serverStream.cancel();
    this.serverStreamController = null;
  }

  // this should happen after receiving PeerJoinedEvent
  private async initializePeerConnection(peerIdToConnect?: string) {
    if (!this.clientId) throw new Error('No clientId exists, cannot proceed');

    this.peerjs = new Peer(this.clientId, {
      config: {
        iceServers: [
          {
            urls: 'stun:stun.relay.metered.ca:80',
          },
        ],
      },
    });

    this.peerjs.on('open', () => {
      if (this.peerjs && this.role === Role.Player && peerIdToConnect) {
        this.p2pConnection = this.peerjs.connect(peerIdToConnect);
        this.setupDataConnectionEventHandlers(this.p2pConnection);
      }

      this.peerConnectionStatus = 'Waiting';
    });

    this.peerjs.on('connection', (conn) => {
      if (this.role === Role.Spectator) {
        this.p2pConnection = conn;
        this.setupDataConnectionEventHandlers(conn);
      }
    });
  }

  // setup data connection
  // Player: happens when server notifies of PeerJoined
  // Spectator: happens when Peer sends data
  private setupDataConnectionEventHandlers(
    dataConnection: DataConnection,
  ): void {
    dataConnection.on('open', () => {
      // do nothing
    });

    dataConnection.on('data', (data) => {
      if (this.peerStreamController) {
        // spectator is ready to play
        this.peerConnectionStatus = 'Connected';
        this.peerStreamController.enqueue({
          ...(data as P2PMessage),
        });
      }
    });

    dataConnection.on('close', () => {
      this.peerConnectionStatus = 'Disconnected';
      this.p2pConnection = null;
    });

    dataConnection.on('error', (error) => {
      console.error('P2P connection error:', error);
      this.peerConnectionStatus = 'Disconnected';
      this.p2pConnection = null;
    });
  }

  sendToPeer(message: InitialStateVectorMessage | DeltaMessage): void {
    if (!this.p2pConnection?.open) return;

    this.p2pConnection.send(message);
  }
}
