use axum::{
    extract::{
        ws::{Message, WebSocket},
        State, WebSocketUpgrade,
    },
    response::Response,
};
use futures_util::{SinkExt, StreamExt};
use tokio::sync::mpsc;
use uuid::Uuid;

use crate::game::{Client, Role, SharedState};
use crate::messages::{ClientMessage, ServerMessage};

pub async fn websocket_handler(ws: WebSocketUpgrade, State(state): State<SharedState>) -> Response {
    ws.on_upgrade(|socket| handle_websocket(socket, state))
}

pub async fn handle_websocket(websocket: WebSocket, state: SharedState) {
    let (mut ws_sender, mut ws_receiver) = websocket.split();
    let (tx, mut rx) = mpsc::unbounded_channel::<String>();
    let client_id = Uuid::new_v4().to_string();

    // handle outgoing messages
    let ws_sender_task = tokio::spawn(async move {
        while let Some(message) = rx.recv().await {
            if ws_sender.send(Message::Text(message.into())).await.is_err() {
                break;
            }
        }
    });

    // Handle incoming messages
    while let Some(message) = ws_receiver.next().await {
        match message {
            Ok(Message::Text(text)) => {
                if let Err(e) = handle_text_message(&text, &client_id, &tx, &state).await {
                    eprintln!("Error handling message: {}", e);
                }
            }
            Ok(Message::Close(_)) => {
                println!("Closing");
                break;
            }
            Err(e) => {
                eprintln!("WebSocket error: {}", e);
                break;
            }
            _ => {
                // Ignore other message types
            }
        }
    }

    cleanup_client(&client_id, &state).await;
    ws_sender_task.abort();
}

async fn handle_text_message(
    text: &str,
    client_id: &str,
    sender: &mpsc::UnboundedSender<String>,
    state: &SharedState,
) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    let client_msg: ClientMessage = serde_json::from_str(text)?;

    match client_msg {
        ClientMessage::ClientJoined => {
            respond_with_role(client_id, sender, state).await;
            // Check if we have both player and spectator - if so, send peer IDs
            register_peer(state).await;
        }
    }

    Ok(())
}

async fn respond_with_role(
    client_id: &str,
    sender: &mpsc::UnboundedSender<String>,
    state: &SharedState,
) {
    let mut session = state.lock().await;

    println!("client joined {}", client_id);
    let role = if session.player.is_none() {
        println!("assigned player");
        session.player = Some(Client {
            id: client_id.to_string(),
            sender: sender.clone(),
        });
        Role::Player
    } else if session.spectator.is_none() {
        println!("assigned spectator");
        session.spectator = Some(Client {
            id: client_id.to_string(),
            sender: sender.clone(),
        });
        Role::Spectator
    } else {
        println!("session full");
        return; // Session full
    };

    let response = ServerMessage::ClientAcknowledged {
        role,
        map: session.map.clone(),
        client_id: client_id.to_string(),
    };

    // Send response immediately
    if let Ok(json) = serde_json::to_string(&response) {
        let _ = sender.send(json);
    }
}

async fn cleanup_client(client_id: &str, state: &SharedState) {
    let mut session = state.lock().await;

    // Remove from player slot
    if let Some(ref player) = session.player {
        if player.id == client_id {
            println!("dropping player");
            session.player = None;
        }
    }

    // Remove from spectator slot
    if let Some(ref spectator) = session.spectator {
        if spectator.id == client_id {
            println!("dropping spectator");
            session.spectator = None;
        }
    }
}

async fn register_peer(state: &SharedState) {
    let session = state.lock().await;

    if let (Some(ref player), Some(ref spectator)) = (&session.player, &session.spectator) {
        // Send peer IDs to both clients
        let player_message = ServerMessage::PeerJoined {
            peer_id: spectator.id.clone(),
        };
        let spectator_message = ServerMessage::PeerJoined {
            peer_id: player.id.clone(),
        };

        if let Ok(json) = serde_json::to_string(&player_message) {
            let _ = player.sender.send(json);
        }
        if let Ok(json) = serde_json::to_string(&spectator_message) {
            let _ = spectator.sender.send(json);
        }

        println!("Sent peer IDs to both clients");
    }
}
