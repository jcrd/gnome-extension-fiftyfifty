/* extension.js
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 * SPDX-License-Identifier: GPL-2.0-or-later
 */

/* exported init */

const { Shell, Meta } = imports.gi

const ExtensionUtils = imports.misc.extensionUtils
const Main = imports.ui.main

function placeWindow(window, r) {
  window.unmaximize(Meta.MaximizeFlags.HORIZONTAL)
  window.unmaximize(Meta.MaximizeFlags.VERTICAL)
  window.move_resize_frame(false, r.x, r.y, r.width, r.height)
}

function generateRects(window, i) {
  const monitor = window.get_monitor()
  const workspace = window.get_workspace()
  const workspaceRect = workspace.get_work_area_for_monitor(monitor)
  return {
    window: {
      x: i == 0 ? workspaceRect.width / 2 : 0,
      y: 0,
      width: workspaceRect.width / 2,
      height: workspaceRect.height,
    },
    workspace: workspaceRect,
  }
}

function rectsEqual(r1, r2) {
  return r1 && r2 && r1.x == r2.x && r1.width == r2.width
}

function disconnectSignals(obj, signals) {
  signals.forEach((signal) => obj.disconnect(signal))
}

class Extension {
  constructor() {
    this.workspaces = new Map()
    this.windowSignals = new Map()
    this.globalSignals = []
    this.splitRects = []
  }

  updateFocusHistory(window, focused = true) {
    const data = this.workspaces.get(window.get_workspace())
    data.focusHistory = data.focusHistory.filter((w) => w !== window)
    if (focused) data.focusHistory.unshift(window)
  }

  enable() {
    this.globalSignals[0] = global.workspace_manager.connect(
      "workspace-added",
      (_, index) => this._onWorkspaceAdded(index)
    )
    this.globalSignals[1] = global.workspace_manager.connect(
      "workspace-removed",
      (_, index) => this._onWorkspaceRemoved(index)
    )

    for (let i = 0; i < global.workspace_manager.n_workspaces; i++) {
      this._onWorkspaceAdded(i)
    }

    const mode = Shell.ActionMode.NORMAL
    const flag = Meta.KeyBindingFlags.IGNORE_AUTOREPEAT
    const settings = ExtensionUtils.getSettings(
      "org.gnome.shell.extensions.fiftyfifty"
    )

    Main.wm.addKeybinding("toggle", settings, flag, mode, () => {
      const workspace = global.workspace_manager.get_active_workspace()
      const windows = this.workspaces
        .get(workspace)
        .focusHistory.slice(0, 2)
        .reverse()

      if (windows.length === 1) return

      let cachedRects = []
      let i = 0

      const fullscreen = windows.reduce((state, window) => {
        const r = generateRects(window, i)
        cachedRects[i++] = r
        return state && rectsEqual(window.get_frame_rect(), r.window)
      }, true)

      i = 0
      windows.forEach((window) => {
        const r = cachedRects[i++]
        placeWindow(window, fullscreen ? r.workspace : r.window)
        window.raise()
      })
    })
  }

  disable() {
    Main.wm.removeKeybinding("toggle")

    disconnectSignals(global.workspace_manager, this.globalSignals)
    for (let i = 0; i < global.workspace_manager.n_workspaces; i++) {
      this._onWorkspaceRemoved(i)
    }
  }

  _onWindowAdded(window) {
    if (!window || window.get_window_type() !== Meta.WindowType.NORMAL) return

    this.windowSignals.set(
      window,
      window.connect("focus", () => this.updateFocusHistory(window))
    )

    if (window.has_focus()) this.updateFocusHistory(window)
  }

  _onWindowRemoved(window) {
    this.updateFocusHistory(window, false)
    window.disconnect(this.windowSignals.get(window))
    this.windowSignals.delete(window)
  }

  _onWorkspaceAdded(index) {
    const workspace = global.workspace_manager.get_workspace_by_index(index)
    const data = { focusHistory: [], signals: [] }

    data.signals[0] = workspace.connect("window-added", (_, window) =>
      this._onWindowAdded(window)
    )
    data.signals[1] = workspace.connect("window-removed", (_, window) =>
      this._onWindowRemoved(window)
    )
    this.workspaces.set(workspace, data)

    workspace.list_windows().forEach((window) => this._onWindowAdded(window))
  }

  _onWorkspaceRemoved(index) {
    const workspace = global.workspace_manager.get_workspace_by_index(index)

    workspace.list_windows().forEach((window) => this._onWindowRemoved(window))

    disconnectSignals(workspace, this.workspaces.get(workspace).signals)
    this.workspaces.delete(workspace)
  }
}

function init() {
  return new Extension()
}
