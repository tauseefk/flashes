use crate::prelude::*;

/// View camera
/// poorly immitates ndarray
pub struct Camera {
    /// column idx of the left most map column included in the view
    left: u8,
    /// row idx of the top most map column included in the view
    top: u8,
    /// width of the camera view, inclusive of `left`
    pub width: u8,
    /// height of the camera view, inclusive of `top`
    pub height: u8,
    /// width of the outer bounding box
    bb_width: u8,
    /// height of outer bounding box
    bb_height: u8,
}

impl Camera {
    pub fn new(bb_width: u8, bb_height: u8) -> Self {
        Self::new_with_data(0, 0, 2, 2, bb_width, bb_height)
    }

    /// less than 2 width/height doesn't make sense
    pub fn new_with_data(
        left: u8,
        top: u8,
        width: u8,
        height: u8,
        bb_width: u8,
        bb_height: u8,
    ) -> Self {
        Self {
            left,
            top,
            width: width.max(2),
            height: height.max(2),
            bb_width,
            bb_height,
        }
    }

    pub fn get_camera_view<T: Copy>(&self, map_state: &Vec<T>) -> Vec<T> {
        return map_state
            .iter()
            .enumerate()
            .filter(|(idx, _)| {
                let grid_pos = idx_to_grid_position(*idx as u16, self.bb_width);

                return grid_pos.0 >= (self.left as i32)
                    && grid_pos.0 < (self.width + self.left) as i32
                    && grid_pos.1 >= (self.top as i32)
                    && grid_pos.1 < (self.height + self.top) as i32;
            })
            .map(|(_, item)| {
                return *item;
            })
            .collect();
    }

    /// Convert the camera viewport position to map position
    pub fn get_map_pos(&self, pos: &Vec2) -> Vec2 {
        Vec2(pos.0 + (self.left as i32), pos.1 + (self.top as i32))
    }

    pub fn pan_camera_at(&mut self, pos: &Vec2) {
        let left_offset = (pos.0 - (self.width as i32) / 2).max(0) as u8;
        let top_offset = (pos.1 - (self.height as i32) / 2).max(0) as u8;

        // left should always be less than outer bb - self.width
        self.left = left_offset.min(self.bb_width - self.width);
        self.top = top_offset.min(self.bb_height - self.height);
    }
}
