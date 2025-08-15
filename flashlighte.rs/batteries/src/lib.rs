mod batteries;
mod utils;

pub mod prelude {
    pub use core::fmt;
    pub use std::collections::HashMap;
    pub use wasm_bindgen::prelude::*;

    pub use crate::batteries::*;
    pub use crate::utils::*;
}

pub use prelude::*;
