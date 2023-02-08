# Fifty Fifty

This Gnome Shell extension provides a simple tiling mechanism to split windows 50/50.

# Usage

The default keybinding is `<Super>f`.

This has one of three effects depending on the tiled and focused state of the two most recently focused windows:

- If at least one of the two most recently focused windows is not tiled, tile both with the focused window on the left.
- If the focused window is tiled on the right, swap it with the window on the left.
- If the focused window is tiled on the left, maximize the two most recently focused windows.
- If only one window has focus history, maximize it.

# License

This project is licensed under the GPL-2.0 license (see [LICENSE](LICENSE)).
