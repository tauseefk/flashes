use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GameMap {
    pub level: Vec<u8>,
    pub width: u8,
    #[serde(rename(serialize = "cellWidth", deserialize = "cellWidth"))]
    pub cell_width: u8,
    #[serde(rename(serialize = "viewWidth", deserialize = "viewWidth"))]
    pub view_width: u8,
}

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

const DEFAULT_MAP_SIZE: u8 = 16;
const DEFAULT_CAMERA_WIDTH: u8 = 12;

const MAP_ROWS: [&str; 16] = [
    "G.........T....T",
    ".........T.TT...",
    ".T...TT.......T.",
    "T..T....T....T..",
    ".....TTT.......T",
    "TTT.....T...TT.T",
    "TT.T....TT.TTT..",
    "..T...TT.TXTTTT.",
    ".TT...TTTT...PTT",
    "TT....T..TT_.TT.",
    "TTTT..TTTTTTTTT.",
    ".......T.T.T....",
    "......T...X.....",
    "T....T.T..T.T.T.",
    ".T.TTTTT...TTT..",
    ".........T.T.TT.",
];

pub fn get_default_map() -> GameMap {
    let map_content: String = MAP_ROWS.join("");
    let level: Vec<u8> = map_content
        .chars()
        .map(|c| u8::from(Glyph::from(c)))
        .collect();

    GameMap {
        level,
        width: DEFAULT_MAP_SIZE,
        cell_width: 40,
        view_width: DEFAULT_CAMERA_WIDTH,
    }
}
