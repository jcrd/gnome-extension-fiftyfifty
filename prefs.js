// Based on: https://github.com/shiznatix/bifocals-gnome-extension/blob/main/prefs.js

const GObject = imports.gi.GObject
const Gtk = imports.gi.Gtk

const ExtensionUtils = imports.misc.extensionUtils

const keys = {
  toggle: "Toggle split",
}

function init() {}

function appendHotkey(model, settings, name, prettyName) {
  let _, key, mods

  if (Gtk.get_major_version() >= 4) {
    ;[_, key, mods] = Gtk.accelerator_parse(settings.get_strv(name)[0])
  } else {
    ;[key, mods] = Gtk.accelerator_parse(settings.get_strv(name)[0])
  }

  const row = model.insert(-1)
  model.set(row, [0, 1, 2, 3], [name, prettyName, mods, key])
}

function setChild(widget, child) {
  if (Gtk.get_major_version() >= 4) {
    widget.set_child(child)
  } else {
    widget.add(child)
  }
}

function buildPrefsWidget() {
  const settings = ExtensionUtils.getSettings(
    "org.gnome.shell.extensions.fiftyfifty"
  )

  const model = new Gtk.ListStore()

  model.set_column_types([
    GObject.TYPE_STRING,
    GObject.TYPE_STRING,
    GObject.TYPE_INT,
    GObject.TYPE_INT,
  ])

  for (const key in keys) {
    appendHotkey(model, settings, key, keys[key])
  }

  const treeView = new Gtk.TreeView({
    model,
    hexpand: true,
    visible: true,
  })

  const renderKeybinding = new Gtk.CellRendererText()
  const colKeybinding = new Gtk.TreeViewColumn({
    title: "Keybinding",
    expand: true,
  })

  colKeybinding.pack_start(renderKeybinding, true)
  colKeybinding.add_attribute(renderKeybinding, "text", 1)

  treeView.append_column(colKeybinding)

  const renderAccel = new Gtk.CellRendererAccel({
    editable: true,
    "accel-mode": Gtk.CellRendererAccelMode.GTK,
  })

  renderAccel.connect("accel-cleared", (_, strIter) => {
    const [success, iter] = model.get_iter_from_string(strIter)

    if (!success) {
      throw new Error("Something went wrong trying to clear the accel")
    }

    const name = model.get_value(iter, 0)

    model.set(iter, [3], [0])
    settings.set_strv(name, [""])
  })

  renderAccel.connect("accel-edited", (_, strIter, key, mods) => {
    const [success, iter] = model.get_iter_from_string(strIter)

    if (!success) {
      throw new Error("Something went wrong trying to set the accel")
    }

    const name = model.get_value(iter, 0)
    const value = Gtk.accelerator_name(key, mods)

    model.set(iter, [2, 3], [mods, key])
    settings.set_strv(name, [value])
  })

  const colAccel = new Gtk.TreeViewColumn({
    title: "Accel",
  })

  colAccel.pack_end(renderAccel, false)
  colAccel.add_attribute(renderAccel, "accel-mods", 2)
  colAccel.add_attribute(renderAccel, "accel-key", 3)

  treeView.append_column(colAccel)

  const shortcutsLabel = new Gtk.Label({
    label: "Keyboard shortcuts",
    halign: Gtk.Align.START,
    justify: Gtk.Justification.LEFT,
    use_markup: false,
    wrap: true,
    visible: true,
  })

  const grid = new Gtk.Grid({
    column_spacing: 10,
    orientation: Gtk.Orientation.VERTICAL,
    row_spacing: 10,
    visible: true,
  })

  grid.set_margin_start(24)
  grid.set_margin_top(24)

  grid.attach_next_to(shortcutsLabel, null, Gtk.PositionType.BOTTOM, 1, 1)
  grid.attach_next_to(treeView, null, Gtk.PositionType.BOTTOM, 1, 1)

  const scrollWindow = new Gtk.ScrolledWindow({
    vexpand: true,
    visible: true,
  })

  setChild(scrollWindow, grid)

  return scrollWindow
}
