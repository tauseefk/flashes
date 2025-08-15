use crate::prelude::*;

#[wasm_bindgen]
#[derive(Debug, PartialEq, Copy, Clone)]
pub struct Vec2(pub i32, pub i32);

#[wasm_bindgen]
impl Vec2 {
    pub fn new() -> Self {
        Vec2::new_with_data(0, 0)
    }

    pub fn new_with_data(x: i32, y: i32) -> Self {
        Self(x, y)
    }
}

#[wasm_bindgen]
#[derive(Debug, Copy, Clone, PartialEq)]
pub struct Move {
    pub from: Vec2,
    pub to: Vec2,
}

#[wasm_bindgen]
impl Move {
    pub fn new() -> Self {
        Move::new_with_data(Vec2::new(), Vec2::new())
    }

    pub fn new_with_data(from: Vec2, to: Vec2) -> Self {
        Self { from, to }
    }
}

impl Default for Move {
    fn default() -> Self {
        Self::new()
    }
}

#[wasm_bindgen]
#[derive(PartialEq, Clone, Copy)]
pub enum Glyph {
    Target,
    Water,
    Tree,
    Rock,
    Floor,
    Player,
    Monster,
    DefeatedMonster,
}

impl Glyph {
    /// any glyph that can be used as a pathfinding target
    pub fn is_targetable(self) -> bool {
        match self {
            Glyph::Target
            | Glyph::Floor
            | Glyph::Player
            | Glyph::Monster
            | Glyph::DefeatedMonster => true,
            _ => false,
        }
    }
}

impl From<u8> for Glyph {
    fn from(value: u8) -> Self {
        match value {
            b'X' | 0 => Glyph::Target,
            b'_' | 1 => Glyph::Water,
            b'T' | 2 => Glyph::Tree,
            b'*' | 3 => Glyph::Rock,
            b'.' | 4 => Glyph::Floor,
            b'P' | 5 => Glyph::Player,
            b'G' | 6 => Glyph::Monster,
            b'g' | 7 => Glyph::DefeatedMonster,
            _ => panic!("Unexpected character {value} found for map glyph."),
        }
    }
}

impl From<Glyph> for u8 {
    fn from(value: Glyph) -> Self {
        match value {
            Glyph::Target => b'X',
            Glyph::Water => b'_',
            Glyph::Tree => b'T',
            Glyph::Rock => b'*',
            Glyph::Floor => b'.',
            Glyph::Player => b'P',
            Glyph::Monster => b'G',
            Glyph::DefeatedMonster => b'g',
        }
    }
}

impl From<char> for Glyph {
    fn from(value: char) -> Self {
        match value {
            'X' => Glyph::Target,
            '_' => Glyph::Water,
            'T' => Glyph::Tree,
            '*' => Glyph::Rock,
            '.' => Glyph::Floor,
            'P' => Glyph::Player,
            'G' => Glyph::Monster,
            'g' => Glyph::DefeatedMonster,
            _ => panic!("Unexpected character {value} found for glyph."),
        }
    }
}

impl fmt::Display for Glyph {
    fn fmt(&self, f: &mut core::fmt::Formatter<'_>) -> core::fmt::Result {
        let cell_repr = match self {
            Glyph::Target => 'X',
            Glyph::Water => '_',
            Glyph::Tree => 'T',
            Glyph::Rock => '*',
            Glyph::Floor => '.',
            Glyph::Player => 'P',
            Glyph::Monster => 'G',
            Glyph::DefeatedMonster => 'g',
        };

        write!(f, "{cell_repr}")
    }
}

impl fmt::Debug for Glyph {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{}", self)
    }
}

impl Glyph {
    pub fn is_empty(&self) -> bool {
        matches!(self, Glyph::Floor | Glyph::Target)
    }

    pub fn is_target(&self) -> bool {
        matches!(self, Glyph::Target)
    }

    pub fn get_legal_moves(&self) -> Vec<Vec2> {
        match self {
            Glyph::Player | Glyph::Monster => vec![
                Vec2::new_with_data(-1, 0),
                Vec2::new_with_data(0, -1),
                Vec2::new_with_data(1, 0),
                Vec2::new_with_data(0, 1),
            ],
            Glyph::Target
            | Glyph::Tree
            | Glyph::Rock
            | Glyph::Water
            | Glyph::Floor
            | Glyph::DefeatedMonster => {
                vec![]
            }
        }
    }
}
