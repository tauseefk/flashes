mod game;
mod handlers;
mod maps;
mod messages;

use axum::{routing::get, Router};
use shuttle_runtime::SecretStore;
use std::sync::Arc;
use tokio::sync::Mutex;
use tower_http::cors::{AllowOrigin, Any, CorsLayer};

use game::{GameSession, SharedState};
use handlers::{health::health_handler, websocket::websocket_handler};

#[shuttle_runtime::main]
async fn main(#[shuttle_runtime::Secrets] secrets: SecretStore) -> shuttle_axum::ShuttleAxum {
    let state: SharedState = Arc::new(Mutex::new(GameSession::default()));

    let allowed_origin = secrets
        .get("ALLOWED_ORIGIN")
        .expect("ALLOWED_ORIGIN secret must be set");

    let cors = CorsLayer::new()
        .allow_origin(AllowOrigin::predicate(move |header, _| {
            header.as_bytes().ends_with(allowed_origin.as_bytes())
        }))
        .allow_methods([axum::http::Method::GET, axum::http::Method::POST])
        .allow_headers(Any);

    let router = Router::new()
        .route("/ws", get(websocket_handler))
        .route("/health", get(health_handler))
        .with_state(state)
        .layer(cors);

    Ok(router.into())
}
