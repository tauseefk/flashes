use crate::prelude::*;

const POTENTIAL_DELTAS: &[Vec2; 4] = &[Vec2(-1, 0), Vec2(0, -1), Vec2(1, 0), Vec2(0, 1)];

fn get_candidates_2(map_state: &Vec<Glyph>, width: u8, curr_pos_idx: u16) -> Vec<u16> {
    // at len = 256 casting as u8 fails
    let height = ((map_state.len()) / (width as usize)) as u8;

    let curr_pos = idx_to_grid_position(curr_pos_idx, width);
    return POTENTIAL_DELTAS
        .iter()
        .map(|pd| Vec2::new_with_data(curr_pos.0 + pd.0, curr_pos.1 + pd.1))
        .filter(|candidate| {
            if !is_in_bounds(&candidate, width, height) {
                return false;
            }

            let candidate_idx = grid_position_to_idx(*candidate, width);
            let glyph = map_state.get(candidate_idx as usize);
            if let Some(glyph) = glyph {
                return is_in_bounds(&candidate, width, height) && glyph.is_targetable();
            } else {
                return false;
            }
        })
        .map(|c| grid_position_to_idx(c, width))
        .collect();
}

fn find_path_u16(
    starting_map: &Vec<Glyph>,
    width: u8,
    from_glyph: Glyph,
    to_glyph: Glyph,
) -> Vec<u16> {
    if (from_glyph != Glyph::Player && from_glyph != Glyph::Monster)
        || (to_glyph != Glyph::Player && to_glyph != Glyph::Target)
    {
        return vec![];
    }

    // Find the cell corresponding to the acting glyph
    let glyph_cell = match starting_map.iter().position(|&c| c == from_glyph) {
        // cast to u8 is fine as max map size is < u8 MAX
        Some(idx) => idx_to_grid_position(idx as u16, width),
        None => Vec2(-1, -1),
    };

    // Find the cell corresponding to the acting glyph
    let dest_cell = match starting_map.iter().position(|&c| c == to_glyph) {
        // cast to u8 is fine as max map size is < u8 MAX
        Some(idx) => idx_to_grid_position(idx as u16, width),
        None => Vec2(-1, -1),
    };

    // at len = 256 casting as u8 fails
    let height = ((starting_map.len()) / (width as usize)) as u8;

    if !is_in_bounds(&glyph_cell, width, height) || !is_in_bounds(&dest_cell, width, height) {
        return vec![];
    }

    let mut visited_cell_idx_cache: HashSet<u16> = HashSet::new();
    visited_cell_idx_cache.insert(grid_position_to_idx(glyph_cell, width));

    let mut parent_map: HashMap<u16, u16> = HashMap::with_capacity(starting_map.len());

    let mut bfs_queue: VecDeque<u16> = VecDeque::with_capacity(starting_map.len());
    // Initialize BFS queue with `cell_idx`s
    bfs_queue.push_back(grid_position_to_idx(glyph_cell, width));

    while bfs_queue.len() > 0 {
        let curr = bfs_queue.pop_front();

        if let Some(curr) = curr {
            let dest_cell_idx = grid_position_to_idx(dest_cell, width);
            if curr == dest_cell_idx {
                let mut path: VecDeque<u16> = VecDeque::with_capacity(starting_map.len());
                let mut node = dest_cell_idx;
                loop {
                    path.push_front(node);
                    match parent_map.get(&node) {
                        Some(parent) => {
                            node = *parent;
                        }
                        _ => {
                            break;
                        }
                    }
                }
                return Vec::from(path);
            }

            let curr_neighbors = get_candidates_2(&starting_map, width, curr);
            for neighbor in curr_neighbors {
                if !visited_cell_idx_cache.contains(&neighbor) {
                    visited_cell_idx_cache.insert(neighbor);
                    parent_map.insert(neighbor, curr);
                    bfs_queue.push_back(neighbor);
                }
            }
        }
    }

    return vec![];
}

pub fn find_path(
    starting_map_data: &Vec<Glyph>,
    width: u8,
    from_glyph: Glyph,
    to_glyph: Glyph,
) -> Vec<Move> {
    let path = find_path_u16(starting_map_data, width, from_glyph, to_glyph);

    if path.is_empty() {
        return vec![];
    }

    let path_shifted = &path[1..];
    let path = &path[..path.len() - 1];

    let sol: Vec<Move> = path
        .iter()
        .zip(path_shifted.iter())
        .map(|(&from, &to)| Move {
            from: idx_to_grid_position(from, width),
            to: idx_to_grid_position(to, width),
        })
        .collect();

    return sol;
}

#[test]
fn automatically_find_player_to_target() {
    let starting_map: Vec<Glyph> = "_PT__.._TT..TTTXTTTT".chars().map(Glyph::from).collect();
    let shortest_path = find_path(&starting_map, 4, Glyph::Player, Glyph::Target);
    // `to` and `from` are flattened into a single array
    assert_eq!(shortest_path.len(), 5);

    // `to` and `from` are flattened into a single array
    let shortest_path = find_path(
        &"P.X".chars().map(Glyph::from).collect(),
        3,
        Glyph::Player,
        Glyph::Target,
    );
    assert_eq!(shortest_path.len(), 2);

    let st = ".P....TT.............T......T......T....T...T......T....T...T......T....T...T......T....T...T......T....T...T......T....T...T......T....T...T......T....T...T......T....T...T......T....T...T......T....T...T......T........T......T........T......T.........X..".chars().map(Glyph::from).collect();
    let shortest_path = find_path(&st, 16, Glyph::Player, Glyph::Target);
    assert_eq!(shortest_path.len(), 27);
}

#[test]
fn automatically_find_monster_to_target() {
    let shortest_path = find_path(
        &"_GT__.._TT..TTTPTTTT".chars().map(Glyph::from).collect(),
        4,
        Glyph::Monster,
        Glyph::Player,
    );
    // `to` and `from` are flattened into a single array
    assert_eq!(shortest_path.len(), 5);

    // `to` and `from` are flattened into a single array
    let shortest_path = find_path(
        &"G.P".chars().map(Glyph::from).collect(),
        3,
        Glyph::Monster,
        Glyph::Player,
    );
    assert_eq!(shortest_path.len(), 2);

    // `to` and `from` are flattened into a single array
    let shortest_path = find_path(
        &"GP".chars().map(Glyph::from).collect(),
        2,
        Glyph::Monster,
        Glyph::Player,
    );
    assert_eq!(shortest_path.len(), 1);

    let st = ".G....TT.............T......T......T....T...T......T....T...T......T....T...T......T....T...T......T....T...T......T....T...T......T....T...T......T....T...T......T....T...T......T....T...T......T....T...T......T........T......T........T......T.........P..".chars().map(Glyph::from).collect();
    let shortest_path = find_path(&st, 16, Glyph::Monster, Glyph::Player);
    assert_eq!(shortest_path.len(), 27);
}
