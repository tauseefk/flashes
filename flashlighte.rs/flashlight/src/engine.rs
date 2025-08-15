use js_sys::Uint8Array;

use crate::prelude::*;

#[cfg(test)]
#[derive(PartialEq)]
pub struct MapState {
    state: Vec<Glyph>,
}

#[cfg(test)]
impl From<&str> for MapState {
    fn from(value: &str) -> Self {
        let glyph_bytes = value.bytes();
        let state: Vec<Glyph> = glyph_bytes.map(|glyph_byte| glyph_byte.into()).collect();

        MapState { state }
    }
}

#[wasm_bindgen]
pub struct MapMetadata {
    pub target_cell_idx: u16,
    pub player_cell_idx: i32,
    pub width: u8,
}

#[wasm_bindgen]
#[derive(Debug, PartialEq)]
pub enum MoveOutcome {
    NoOp,
    Rejected,
    Advance,
    End,
}

#[wasm_bindgen]
pub struct Flashlight {
    pub width: u8,
    height: u8,
    pub view_width: u8,
    map_state_doc: Doc,
    camera: Camera,
    visibility_state: HashMap<IVec2, i32>,
    cell_width: u8,
    monster_cell: Vec2,
    target_cell: Vec2,
    player_cell: Vec2,
    pub player_poise: u8,
    pub monster_poise: u8,
}

#[wasm_bindgen]
impl Flashlight {
    pub fn new(level: Vec<Glyph>, width: u8, cell_width: u8, view_width: u8) -> Self {
        let mut target_cell = Vec2::new();
        let mut player_cell = Vec2::new();
        let mut monster_cell = Vec2::new();

        for (idx, char) in level.iter().enumerate() {
            let char_glyph: Glyph = *char;
            if char_glyph == Glyph::Target {
                target_cell = idx_to_grid_position(idx as u16, width);
            }
            if char_glyph == Glyph::Player {
                player_cell = idx_to_grid_position(idx as u16, width);
            }
            if char_glyph == Glyph::Monster {
                monster_cell = idx_to_grid_position(idx as u16, width);
            }
        }

        // make sure camera view includes the player
        // assumes 1:1 aspect ratio
        let mut camera = Camera::new_with_data(0, 0, view_width, view_width, width, width);
        camera.pan_camera_at(&player_cell);

        let map_state_doc = Doc::new();
        let map_state = map_state_doc.get_or_insert_text("map_state");
        // need to drop the transaction to give up the exclusive borrow
        {
            let mut txn = map_state_doc.transact_mut();
            let level_str: String = level
                .iter()
                .map(|g| g.to_string())
                .collect::<Vec<String>>()
                .join("");
            map_state.insert(&mut txn, 0, &level_str);

            txn.commit();
        }

        let initial_state_vector = {
            let txn = map_state_doc.transact();
            txn.encode_state_as_update_v1(&yrs::StateVector::default())
        };
        Flashlight::send_state_vector(initial_state_vector);

        Self {
            width,
            view_width,
            // level.len == 256, which is > u8_MAX so need casting
            height: (level.len() / (width as usize)) as u8,
            visibility_state: HashMap::new(),
            cell_width,
            map_state_doc,
            camera,
            monster_cell,
            target_cell,
            player_cell,
            player_poise: 100,
            monster_poise: 120,
        }
    }

    /// This function creates a new `Flashlight` instance from a JavaScript `Uint8Array`.
    ///
    /// It converts the `Uint8Array` into a vector of `Glyph` and initializes the `Flashlight` instance
    /// with the given level and width.
    pub fn new_from_js(
        level: js_sys::Uint8Array,
        width: u8,
        cell_width: u8,
        view_width: u8,
    ) -> Self {
        #[cfg(debug_assertions)]
        console_error_panic_hook::set_once();

        let level: Vec<u8> = level.to_vec();
        let level: Vec<Glyph> = level.iter().map(|char| (*char).into()).collect();

        Self::new(level, width, cell_width, view_width)
    }

    /// This function returns the current state of the map (after applying visibility mask and camera clipping) as a Vector of `Glyph`s.
    pub fn get_clipped_map_state(&self) -> Vec<Glyph> {
        let glyphs = self.get_map_glyphs();

        let visible_map_state = glyphs
            .iter()
            .enumerate()
            .map(|(idx, glyph)| {
                let Vec2(x, y) = idx_to_grid_position(idx as u16, self.width);
                let pos = IVec2 { x, y };
                match self.visibility_state.contains_key(&pos) {
                    true => match *glyph == Glyph::Monster {
                        true => match self.monster_poise > 0 {
                            true => *glyph,
                            false => Glyph::DefeatedMonster,
                        },
                        false => *glyph,
                    },
                    // default to returning tree if glyph is invisible
                    false => Glyph::Tree,
                }
            })
            .collect();

        // return only the slice that's in the camera view
        self.camera.get_camera_view(&visible_map_state)
    }

    /// This function returns the metadata of the current map state.
    #[wasm_bindgen(getter)]
    pub fn map_metadata(&self) -> MapMetadata {
        MapMetadata {
            target_cell_idx: self.grid_position_to_idx(self.target_cell),
            player_cell_idx: self.grid_position_to_idx(self.player_cell) as i32,
            width: self.width,
        }
    }

    /// This function returns the current state of the visibility map as a `Uint32Array`.
    ///
    /// The visibility state is represented as a vector of `u8` values, where each value
    /// corresponds to a TileType.
    #[wasm_bindgen(getter)]
    pub fn visibility_state(&self) -> js_sys::Int32Array {
        let map_length = self.height as usize * self.width as usize;
        let mut visibility_state = vec![-1; map_length];

        for idx in 0..map_length {
            let Vec2(x, y) = idx_to_grid_position(idx as u16, self.width);
            let pos = IVec2 { x, y };
            visibility_state[idx] = match self.visibility_state.contains_key(&pos) {
                true => *self.visibility_state.get(&pos).unwrap(),
                false => i32::MAX,
            };
        }

        let camera_view = self.camera.get_camera_view(&visibility_state);
        js_sys::Int32Array::from(&camera_view[..])
    }

    pub fn compute_visibility(&mut self) {
        let glyphs = self.get_map_glyphs();

        let tiles = glyphs
            .iter()
            .map(|glyph| match glyph {
                Glyph::Water
                | Glyph::Monster
                | Glyph::DefeatedMonster
                | Glyph::Player
                | Glyph::Floor => TileType::Transparent,
                Glyph::Target | Glyph::Tree | Glyph::Rock => TileType::Opaque,
            })
            .collect();

        let world_dimensions = WorldDimensions {
            rows: self.width as i32,
            cols: self.height as i32,
            cell_width: self.cell_width as i32,
        };
        let mut visibility: Visibility = Visibility::new(world_dimensions, false, 8);

        visibility.observer = IVec2 {
            x: self.player_cell.0,
            y: self.player_cell.1,
        };
        let visible_tiles_hashmap = visibility.compute_visible_tiles(&TileGrid {
            tiles,
            grid_dimensions: world_dimensions,
        });

        self.visibility_state = visible_tiles_hashmap;
    }

    /// Just a wrapper for binding the width argument.
    #[allow(dead_code)]
    fn idx_to_grid_position(&self, idx: u16) -> Vec2 {
        idx_to_grid_position(idx, self.width)
    }

    /// Sends a delta to other players
    #[allow(unused_variables)]
    fn send_delta(&self, update: Vec<u8>) {
        #[cfg(not(test))]
        crate::send_delta(&update[..]);
    }

    /// Sends the initial state vector to other players
    #[allow(unused_variables)]
    fn send_state_vector(state_vector: Vec<u8>) {
        #[cfg(not(test))]
        crate::send_initial_state_vector(&state_vector[..]);
    }

    pub fn apply_initial_state_vector_js(&mut self, state_vector: Uint8Array) {
        self.apply_initial_state_vector(&state_vector.to_vec());
    }

    /// Applies the initial state vector received from the player
    fn apply_initial_state_vector(&mut self, state_vector: &[u8]) {
        // Check for empty state vector
        if state_vector.is_empty() {
            return;
        }

        // Create a new doc and apply the state vector to it
        let new_map_state_doc = Doc::new();

        {
            let mut txn = new_map_state_doc.transact_mut();
            match Update::decode_v1(state_vector) {
                Ok(u) => {
                    let _ = txn.apply_update(u);
                    txn.commit();
                }
                Err(_) => {
                    // could not decode state vector
                    return;
                }
            }
        }

        // Replace the existing map_state_doc with the new one
        self.map_state_doc = new_map_state_doc;
    }

    pub fn apply_delta_js(&mut self, delta: Uint8Array) {
        self.apply_delta(&delta.to_vec());
    }

    /// Applies a delta received from the other player
    fn apply_delta(&mut self, delta: &[u8]) {
        // Check for empty delta
        if delta.is_empty() {
            return;
        }

        {
            let mut txn = self.map_state_doc.transact_mut();
            match Update::decode_v1(delta) {
                Ok(u) => {
                    let _ = txn.apply_update(u);
                    txn.commit();
                }
                Err(_) => {
                    // could not decode delta
                    return;
                }
            }
        }

        self.reset_character_positions();
    }

    /// resets the character positions if they are not in sync with the map state
    fn reset_character_positions(&mut self) {
        let glyphs = self.get_map_glyphs();

        let mut target_cell = Vec2::new();
        let mut player_cell = Vec2::new();
        let mut monster_cell = Vec2::new();

        for (idx, glyph) in glyphs.iter().enumerate() {
            let char_glyph: Glyph = *glyph;
            if char_glyph == Glyph::Target {
                target_cell = self.idx_to_grid_position(idx as u16);
            }
            if char_glyph == Glyph::Player {
                player_cell = self.idx_to_grid_position(idx as u16);
            }
            if char_glyph == Glyph::Monster {
                monster_cell = self.idx_to_grid_position(idx as u16);
            }
        }

        self.target_cell = target_cell;
        self.player_cell = player_cell;
        self.monster_cell = monster_cell;
        self.camera.pan_camera_at(&player_cell);
    }

    /// This function allows the user to select a cell on the map.
    pub fn do_move_player(&mut self, pos: Vec2) -> MoveOutcome {
        if self.is_end_state() {
            return MoveOutcome::End;
        }

        if !self.is_in_bounds(pos) {
            return MoveOutcome::Rejected;
        }

        if self.player_cell == pos {
            return MoveOutcome::NoOp;
        }

        self.move_glyph(Move::new_with_data(self.player_cell, pos))
    }

    /// This function checks whether the full map is solvable.
    /// Does not apply visibility and camera clipping masks to map state.
    ///
    pub fn is_solvable(&mut self) -> bool {
        let glyphs = self.get_map_glyphs();

        let monster_solution = find_path(&glyphs, self.width, Glyph::Monster, Glyph::Player);
        let player_solution = find_path(&glyphs, self.width, Glyph::Player, Glyph::Target);

        return monster_solution.len() > 0 && player_solution.len() > 0;
    }

    /// This function moves the monster towards the player.
    ///
    pub fn do_move_enemy(&mut self) -> MoveOutcome {
        let clipped_path = find_path(
            &self.get_clipped_map_state(),
            self.camera.width,
            Glyph::Monster,
            Glyph::Player,
        );

        let clipped_first_move = clipped_path.first();

        if let Some(clipped_first_move) = clipped_first_move {
            let map_pos = self.camera.get_map_pos(&clipped_first_move.to);

            if !self.is_in_bounds(map_pos) {
                return MoveOutcome::Rejected;
            }

            if self.monster_cell == map_pos {
                return MoveOutcome::NoOp;
            }

            return self.move_glyph(Move::new_with_data(self.monster_cell, map_pos));
        }

        return MoveOutcome::NoOp;
    }

    /// This function allows the user to select a cell on the map.
    /// If no cell is currently selected, it will select the given cell if it contains an
    /// interactable glyph.
    ///
    /// If a cell is already selected, it will attempt to move
    /// the glyph from the selected cell to the given cell.
    ///
    /// If the move is valid,
    /// it will be executed.
    fn move_glyph(&mut self, current_move: Move) -> MoveOutcome {
        if !self.is_in_bounds(current_move.to) {
            return MoveOutcome::NoOp;
        }

        let current_glyph = self.get_glyph_at_position(current_move.from);
        let target_glyph = self.get_glyph_at_position(current_move.to);

        if !self.is_move_legal(current_move) {
            // exposure determines how much player/monster gets damaged
            let exposure_fraction =
                self.visibility_state.len() as f32 / (self.width as f32 * self.height as f32);

            let player_damage = ((1.0 - exposure_fraction) * 100.).min(20.) as i32;
            let monster_damage = (exposure_fraction * 100.).min(20.) as i32;

            // losing some fidelity is okay
            // monster is more vulnerable in light
            // player is more vulnerable in darkness
            match (current_glyph, target_glyph) {
                (Some(Glyph::Player), target_glyph) => match target_glyph {
                    Some(Glyph::Monster) => {
                        self.reduce_monster_poise(monster_damage);
                    }
                    _ => {
                        self.reduce_player_poise(1);
                    }
                },
                (Some(Glyph::Monster), Some(Glyph::Player)) => {
                    self.reduce_player_poise(player_damage);
                }
                (_, _) => {}
            };

            return MoveOutcome::Rejected;
        } else {
            match (current_glyph, target_glyph) {
                (Some(Glyph::Player), Some(Glyph::Target)) => {
                    self.increase_player_poise();
                }
                (_, _) => {}
            }
        }

        match current_glyph {
            None => MoveOutcome::Rejected,
            Some(current_glyph) => {
                if self.place_glyph_at_position(current_move.to, current_glyph) {
                    self.make_cell_empty(current_move.from);

                    let outcome = match self.is_end_state() {
                        true => MoveOutcome::End,
                        false => MoveOutcome::Advance,
                    };

                    // TODO: is this check really necessary?
                    if outcome == MoveOutcome::Advance || outcome == MoveOutcome::End {
                        if current_glyph == Glyph::Player {
                            self.player_cell = current_move.to;
                            self.camera.pan_camera_at(&self.player_cell);
                        }
                        if current_glyph == Glyph::Monster {
                            self.monster_cell = current_move.to;
                        }
                    };

                    return outcome;
                }
                MoveOutcome::NoOp
            }
        }
    }

    /// Reduces player poise based on a damage value
    fn reduce_player_poise(&mut self, damage: i32) {
        let updated_health: i32 = self.player_poise as i32 - damage;

        self.player_poise = updated_health.max(0) as u8;
    }

    fn increase_player_poise(&mut self) {
        self.player_poise = self.player_poise + 50;
    }

    fn reduce_monster_poise(&mut self, damage: i32) {
        let updated_health: i32 = self.monster_poise as i32 - damage;

        self.monster_poise = updated_health.max(0) as u8;
    }

    /// This function places a glyph at the specified position on the map.
    fn place_glyph_at_position(&mut self, pos: Vec2, glyph: Glyph) -> bool {
        if !self.is_in_bounds(pos) {
            return false;
        }

        let idx = self.grid_position_to_idx(pos);

        let map_state = self.map_state_doc.get_or_insert_text("map_state");
        let mut txn = self.map_state_doc.transact_mut();
        map_state.remove_range(&mut txn, idx as u32, 1);
        map_state.insert(&mut txn, idx as u32, &glyph.to_string());

        let update = txn.encode_update_v1();
        txn.commit();

        self.send_delta(update);

        true
    }

    fn make_cell_empty(&mut self, pos: Vec2) {
        self.place_glyph_at_position(pos, Glyph::Floor);
    }

    /// Checks if the move is legal by verifying if the destination cell is empty
    /// and if the move is within movable distance.
    fn is_move_legal(&self, current_move: Move) -> bool {
        let destination = self.get_glyph_at_position(current_move.to);

        match destination {
            None => {}
            Some(destination) => {
                if !destination.is_empty() {
                    return false;
                }
            }
        };

        let current_glyph = self.get_glyph_at_position(current_move.from);
        match current_glyph {
            None => false,
            Some(current_glyph) => {
                let legal_moves = current_glyph.get_legal_moves();

                legal_moves.iter().any(|&delta| {
                    delta.0 == current_move.from.0 - current_move.to.0
                        && delta.1 == current_move.from.1 - current_move.to.1
                })
            }
        }
    }

    /// This function retrieves the glyph at the given position on the map.
    fn get_glyph_at_position(&self, pos: Vec2) -> Option<Glyph> {
        let idx = match self.is_in_bounds(pos) {
            false => None,
            true => Some(self.grid_position_to_idx(pos)),
        };

        match idx {
            None => None,
            Some(idx) => {
                let glyphs = self.get_map_glyphs();
                let glyph = glyphs.get(idx as usize);
                match glyph {
                    None => None,
                    Some(glyph) => Some(*glyph),
                }
            }
        }
    }

    /// This function checks if a given position is within the bounds of the map.
    fn is_in_bounds(&self, pos: Vec2) -> bool {
        pos.0 >= 0 && pos.0 < (self.width as i32) && pos.1 >= 0 && pos.1 < (self.height as i32)
    }

    /// This function checks if the game has reached its end state.
    ///
    /// The end state is defined as the condition where the `Player` glyph
    /// is located at the target cell position on the map.
    fn is_end_state(&self) -> bool {
        self.player_poise == 0 || self.monster_poise == 0
    }

    /// Just a wrapper for binding the width argument.
    fn grid_position_to_idx(&self, pos: Vec2) -> u16 {
        grid_position_to_idx(pos, self.width)
    }

    fn get_map_glyphs(&self) -> Vec<Glyph> {
        let map_state = self.map_state_doc.get_or_insert_text("map_state");
        let txn = self.map_state_doc.transact();
        let map_state_string = map_state.get_string(&txn);
        let map_glyphs: Vec<Glyph> = map_state_string.chars().map(|glyph| glyph.into()).collect();

        map_glyphs
    }
}

#[test]
fn runs() {
    // _ P * _
    // _ . T _
    // T . . .
    // T * * X
    // . * * .
    let map: MapState = "_P*__.T_T...T**X.**.".into();

    let flashlight = Flashlight::new(map.state.to_vec(), 4, 40, 4);

    assert_eq!(flashlight.width, 4);
}

#[test]
fn has_correct_map_state() {
    let map: MapState = "_P*__.T_T...T**X.**.".into();

    let flashlight = Flashlight::new(map.state.to_vec(), 4, 40, 4);

    let expected_map: MapState = "_P*__.T_T...T**X.**.".into();
    let expected_map_glyphs: Vec<Glyph> = expected_map.state;

    let map_glyphs = flashlight.get_map_glyphs();

    assert_eq!(&map_glyphs[..], &expected_map_glyphs[..]);
}

#[test]
fn make_valid_move() {
    // _ P * _
    // _ . T _
    // T . . .
    // T * * X
    // . * * .
    let starting_map: MapState = "_P*__.T_T...T**X.**.".into();

    let mut flashlight = Flashlight::new(starting_map.state.to_vec(), 4, 40, 4);

    let cells_to_select = vec![flashlight.idx_to_grid_position(5)];

    let mut outcome = MoveOutcome::NoOp;
    for cell in cells_to_select.iter() {
        outcome = flashlight.do_move_player(*cell);
    }

    assert_eq!(outcome, MoveOutcome::Advance);

    let expected_map: MapState = "_.*__PT_T...T**X.**.".into();

    let map_glyphs = flashlight.get_map_glyphs();

    assert_eq!(&map_glyphs[..], &expected_map.state[..]);
}

#[test]
fn reject_move_to_non_interactable_cell() {
    // _ P * _
    // _ . T _
    // T . . .
    // T * * X
    // . * * .
    let map: MapState = "_P*__.T_T...T**X.**.".into();

    let mut flashlight = Flashlight::new(map.state.to_vec(), 4, 40, 4);

    let water_cell = Vec2::new_with_data(0, 0);
    let outcome = flashlight.do_move_player(water_cell);

    let map_glyphs = flashlight.get_map_glyphs();

    assert_eq!(outcome, MoveOutcome::Rejected);
    assert_eq!(&map_glyphs[..], &map.state[..]);
}

#[cfg(test)]
#[wasm_bindgen_test::wasm_bindgen_test]
fn runs_using_js_data() {
    let map: MapState = "_P*__.T_T...T**X.**.".into();

    let map_state: Vec<u8> = map
        .state
        .clone()
        .into_iter()
        .map(|glyph| {
            // convert usize to u32, considered harmless as values should not exceed u32_Max
            glyph as u8
        })
        .collect();
    let flashlight = Flashlight::new_from_js(js_sys::Uint8Array::from(&map_state[..]), 4, 40, 4);

    assert_eq!(flashlight.width, 4);
}

#[cfg(test)]
#[wasm_bindgen_test::wasm_bindgen_test]
fn make_valid_move_using_idx() {
    let map: MapState = "_P*__.T_T...T**X.**.".into();
    let map_state: Vec<u8> = map
        .state
        .clone()
        .into_iter()
        .map(|glyph| {
            // convert usize to u32, considered harmless as values should not exceed u32_Max
            glyph as u8
        })
        .collect();

    let mut flashlight =
        Flashlight::new_from_js(js_sys::Uint8Array::from(&map_state[..]), 4, 40, 4);

    let outcome = flashlight.do_move_player(idx_to_grid_position(5, 4));

    assert_eq!(outcome, MoveOutcome::Advance);

    // _ P * _
    // _ . T _
    // T . . .
    // T * * X
    // . * * .
    let expected_map: MapState = "_.*__PT_T...T**X.**.".into();

    // need a separate lexical scope to avoid borrow conflict due to mutable borrow later
    {
        let map_glyphs = flashlight.get_map_glyphs();

        assert_eq!(&map_glyphs[..], &expected_map.state[..]);
    }

    let outcome = flashlight.do_move_player(idx_to_grid_position(9, 4));

    assert_eq!(outcome, MoveOutcome::Advance);

    let expected_map: MapState = "_.*__.T_TP..T**X.**.".into();

    let map_glyphs = flashlight.get_map_glyphs();

    assert_eq!(&map_glyphs[..], &expected_map.state[..]);
}

#[test]
fn reject_oob_move() {
    let starting_map: MapState = "P...".into();

    let mut flashlight = Flashlight::new(starting_map.state.to_vec(), 2, 40, 2);

    let cells_to_select = vec![Vec2::new_with_data(2, 2)];

    let mut outcome = MoveOutcome::NoOp;
    for cell in cells_to_select.iter() {
        outcome = flashlight.do_move_player(*cell)
    }

    assert_eq!(outcome, MoveOutcome::Rejected);
}

#[test]
fn move_monster() {
    let starting_map: MapState = "P..G............".into();

    let mut flashlight = Flashlight::new(starting_map.state.to_vec(), 4, 40, 4);
    flashlight.compute_visibility();

    let cells_to_select = vec![Vec2::new_with_data(0, 1)];

    let mut outcome = MoveOutcome::NoOp;
    for cell in cells_to_select.iter() {
        outcome = flashlight.do_move_player(*cell)
    }

    assert_eq!(outcome, MoveOutcome::Advance);

    let outcome = flashlight.do_move_enemy();

    assert_eq!(outcome, MoveOutcome::Advance);
}

#[test]
fn reject_monster_move_that_bumps_into_player() {
    // P . . G
    // . . . .
    // . . . .
    // . . . .
    let starting_map: MapState = "P..G............".into();

    let mut flashlight = Flashlight::new(starting_map.state.to_vec(), 4, 40, 4);
    flashlight.compute_visibility();

    let cells_to_select = vec![Vec2::new_with_data(0, 1)];

    let mut outcome = MoveOutcome::NoOp;
    for cell in cells_to_select.iter() {
        outcome = flashlight.do_move_player(*cell)
    }

    assert_eq!(outcome, MoveOutcome::Advance);

    let mut outcome = MoveOutcome::NoOp;
    for _ in 0..4 {
        outcome = flashlight.do_move_enemy();
    }

    assert_eq!(outcome, MoveOutcome::Rejected);
    assert_eq!(flashlight.monster_cell, Vec2(0, 0));
}

#[test]
fn show_correct_visibility() {
    // _ . * _
    // _ * T _
    // T P . .
    // T * * X
    let starting_map: MapState = "_.*__*T_TP..T**X".into();

    // 0 0 0 0
    // 1 1 1 1
    // 1 P 1 1
    // 1 1 1 1
    // 0 0 0 0
    let mut flashlight = Flashlight::new(starting_map.state.to_vec(), 4, 40, 4);

    flashlight.compute_visibility();
    let map_length = (flashlight.height * flashlight.width) as usize;
    let mut visibility_state = vec![-1; map_length];

    for idx in 0..map_length {
        let Vec2(x, y) = idx_to_grid_position(idx as u16, flashlight.width);
        let pos = IVec2 { x, y };
        visibility_state[idx] = match flashlight.visibility_state.contains_key(&pos) {
            true => 1,
            false => 0,
        };
    }

    let expected = vec![0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1];

    assert_eq!(visibility_state.to_vec(), expected.to_vec());
}

#[cfg(test)]
#[wasm_bindgen_test::wasm_bindgen_test]
fn show_correct_visibility_from_js() {
    // _ . * _
    // _ * T _
    // T P . .
    // T * * X
    let starting_map: MapState = "_.*__*T_TP..T**X".into();

    // 0 0 0 0
    // 1 1 1 1
    // 1 P 1 1
    // 1 1 1 1
    // 0 0 0 0
    let mut flashlight = Flashlight::new(starting_map.state.to_vec(), 4, 40, 4);

    flashlight.compute_visibility();
    let visibility = flashlight.visibility_state();
    let expected = js_sys::Int32Array::from(&[0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1][..]);
    assert_eq!(visibility.to_vec(), expected.to_vec());
}

#[test]
fn pick_up_health_pack() {
    // _ P * _
    // _ . T _
    // T . . .
    // T * * X
    // . * * .
    let starting_map: MapState = "_P*__.T_T...T**X.**.".into();

    let mut flashlight = Flashlight::new(starting_map.state.to_vec(), 4, 40, 4);

    let cells_to_select = vec![
        flashlight.idx_to_grid_position(5),
        flashlight.idx_to_grid_position(9),
        flashlight.idx_to_grid_position(10),
        flashlight.idx_to_grid_position(11),
        flashlight.idx_to_grid_position(15),
    ];
    let player_poise = flashlight.player_poise;

    let mut outcome = MoveOutcome::NoOp;
    for cell in cells_to_select.iter() {
        outcome = flashlight.do_move_player(*cell)
    }

    assert_eq!(outcome, MoveOutcome::Advance);
    assert!(flashlight.player_poise > player_poise);
}

#[test]
fn test_flashlight_state_vector_sync() {
    use std::sync::mpsc;

    // Create a test map
    let starting_map: MapState = "_P*__.T_T...T**X.**.".into();
    let starting_map_2: MapState = "_...................".into();

    // Initialize first flashlight instance with the map
    let mut flashlight_a = Flashlight::new(starting_map.state.clone(), 4, 40, 4);

    // Get the initial state vector from the first instance
    let initial_state_vector = {
        let txn = flashlight_a.map_state_doc.transact();
        txn.encode_state_as_update_v1(&yrs::StateVector::default())
    };

    // Initialize second flashlight instance (empty initially)
    let mut flashlight_b = Flashlight::new(starting_map_2.state.clone(), 4, 40, 4);

    // Apply the initial state vector to the second instance
    flashlight_b.apply_initial_state_vector(&initial_state_vector);

    // Verify both instances have the same initial state
    let state_a_initial = flashlight_a.get_map_glyphs();
    let state_b_initial = flashlight_b.get_map_glyphs();
    assert_eq!(state_a_initial, state_b_initial);

    // Create mpsc channel for delta communication
    let (tx, rx) = mpsc::channel::<Vec<u8>>();

    // Set up observer on flashlight_a to capture deltas
    let _subscription = flashlight_a
        .map_state_doc
        .observe_update_v1(move |_txn, event| {
            tx.send(event.update.clone()).unwrap();
        })
        .unwrap();

    // Make a move on the first flashlight (move player from position 1 to position 5)
    let move_result = flashlight_a.do_move_player(flashlight_a.idx_to_grid_position(5));

    assert_eq!(move_result, MoveOutcome::Advance);

    // Receive and apply both deltas that arrive from the move
    // First delta
    let delta1 = rx.recv().unwrap();
    flashlight_b.apply_delta(&delta1);

    // Second delta
    let delta2 = rx.recv().unwrap();
    flashlight_b.apply_delta(&delta2);

    // Get the final states
    let state_a_final = flashlight_a.get_map_glyphs();
    let state_b_final = flashlight_b.get_map_glyphs();

    // Compare final states - they should be identical
    assert_eq!(state_a_final, state_b_final);
}
