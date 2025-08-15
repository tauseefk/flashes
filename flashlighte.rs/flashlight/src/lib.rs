mod camera;
mod engine;

pub mod prelude {
    pub use core::fmt;
    pub use std::collections::HashMap;

    pub use wasm_bindgen::prelude::*;
    pub use yrs::{
        Doc, GetString, Observable, ReadTxn, Subscription, Text, TextRef, Transact, TransactionMut,
        Update,
        types::Delta,
        types::text::TextEvent,
        updates::decoder::Decode,
        updates::encoder::{Encode, Encoder, EncoderV1},
    };

    pub use batteries::*;
    pub use pathfinder::find_path;
    pub use shadowcaster::{IVec2, TileGrid, TileType, Visibility, WorldDimensions};

    pub use crate::camera::*;
    pub use crate::engine::*;
}

pub use prelude::*;

#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_name = sendDelta)]
    fn send_delta(delta: &[u8]);

    #[wasm_bindgen(js_name = sendInitialStateVector)]
    fn send_initial_state_vector(initialStateVector: &[u8]);
}
