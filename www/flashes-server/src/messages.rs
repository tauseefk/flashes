use serde::{Deserialize, Serialize};

use crate::game::Role;
use crate::maps::GameMap;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type")]
pub enum ServerMessage {
    ClientAcknowledged {
        role: Role,
        map: GameMap,
        #[serde(rename = "clientId")]
        client_id: String,
    },
    PeerJoined {
        #[serde(rename = "peerId")]
        peer_id: String,
    },
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type")]
pub enum ClientMessage {
    ClientJoined,
}
