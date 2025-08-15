use crate::prelude::*;

pub fn grid_position_to_idx(pos: Vec2, width: u8) -> u16 {
    (pos.1 as u16) * width as u16 + (pos.0 as u16)
}

pub fn idx_to_grid_position(idx: u16, width: u8) -> Vec2 {
    Vec2::new_with_data((idx as i32) % (width as i32), (idx as i32) / (width as i32))
}

pub fn is_in_bounds(pos: &Vec2, width: u8, height: u8) -> bool {
    pos.0 >= 0 && pos.0 < (width as i32) && pos.1 >= 0 && pos.1 < (height as i32)
}

#[test]
fn calculates_indices_from_grid_positions() {
    assert_eq!(grid_position_to_idx(Vec2::new_with_data(2, 2), 4), 10);
    assert_eq!(grid_position_to_idx(Vec2::new_with_data(2, 3), 4), 14);
    assert_eq!(grid_position_to_idx(Vec2::new_with_data(0, 0), 4), 0);
    assert_eq!(grid_position_to_idx(Vec2::new_with_data(1, 1), 4), 5);
}

#[test]
fn calculates_grid_positions_from_indices() {
    assert_eq!(idx_to_grid_position(10, 4), Vec2::new_with_data(2, 2));
    assert_eq!(idx_to_grid_position(14, 4), Vec2::new_with_data(2, 3));
    assert_eq!(idx_to_grid_position(0, 4), Vec2::new_with_data(0, 0));
    assert_eq!(idx_to_grid_position(5, 4), Vec2::new_with_data(1, 1));
}
