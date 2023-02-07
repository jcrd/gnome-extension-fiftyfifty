SCHEMA = schemas/org.gnome.shell.extensions.fiftyfifty.gschema.xml
ZIP = fiftyfifty@jcrd.github.io.shell-extension.zip

build/$(ZIP): extension.js prefs.js metadata.json schemas/gschemas.compiled
	mkdir build
	gnome-extensions pack -o build

schemas/gschemas.compiled: $(SCHEMA)
	glib-compile-schemas schemas

clean:
	rm -rf build
	rm -rf schemas/gschemas.compiled

.PHONY: clean
