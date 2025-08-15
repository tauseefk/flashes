use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tokio::sync::{mpsc, Mutex};

use crate::maps::{get_default_map, GameMap};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum Role {
    Player,
    Spectator,
}

#[derive(Debug, Clone)]
pub struct Client {
    pub id: String,
    pub sender: mpsc::UnboundedSender<String>,
}

#[derive(Debug)]
pub struct GameSession {
    pub player: Option<Client>,
    pub spectator: Option<Client>,
    pub map: GameMap,
}

impl Default for GameSession {
    fn default() -> Self {
        Self {
            player: None,
            spectator: None,
            map: get_default_map(),
        }
    }
}

pub type SharedState = Arc<Mutex<GameSession>>;
