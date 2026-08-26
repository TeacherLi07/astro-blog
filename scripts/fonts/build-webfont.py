from pathlib import Path
import sys

from fontTools import ttLib
from fontTools.subset import Options, Subsetter
from fontTools.varLib import instancer


LAYOUT_FEATURES = ["calt", "ccmp", "locl", "kern", "mark", "mkmk", "liga", "rlig"]
NAME_IDS = [1, 2, 3, 4, 6, 16, 17]


def subset_font(font: ttLib.TTFont, charset: str) -> None:
    options = Options()
    options.layout_features = LAYOUT_FEATURES
    options.name_IDs = NAME_IDS
    options.name_languages = ["*"]
    options.notdef_outline = True
    options.recommended_glyphs = True
    options.drop_tables += ["BASE", "meta", "vhea", "vmtx", "VVAR"]

    subsetter = Subsetter(options=options)
    subsetter.populate(text=charset)
    subsetter.subset(font)


def main() -> None:
    if len(sys.argv) != 7:
        raise SystemExit(
            "usage: build-webfont.py SOURCE CHARSET OUTPUT COVERED_CHARSET WEIGHT_MIN WEIGHT_MAX"
        )

    source_path, charset_path, output_path, covered_charset_path = map(Path, sys.argv[1:5])
    weight_min, weight_max = int(sys.argv[5]), int(sys.argv[6])
    charset = charset_path.read_text(encoding="utf8")

    # Keep the two expensive phases in distinct font objects. Reusing the lazy font
    # after instancing can leave generated variable tables referring to pruned
    # layout glyphs when the second subset pass runs.
    initial_font = ttLib.TTFont(source_path)
    try:
        cmap = initial_font.getBestCmap()
        supported = "".join(character for character in dict.fromkeys(charset) if ord(character) in cmap)
        covered_charset_path.write_text(supported, encoding="utf8")

        # The first pass removes unused glyphs while the complete source axis is intact.
        subset_font(initial_font, charset)
        initial_font.flavor = "woff2"
        intermediate_path = output_path.with_name(f"{output_path.stem}-instancer-input.woff2")
        initial_font.save(intermediate_path)
    finally:
        initial_font.close()

    variable_font = ttLib.TTFont(intermediate_path)
    try:
        # Restricting the axis after glyph pruning is much faster on a CJK font than
        # instancing the complete release. The instancer also prunes deltas that are
        # no longer needed by the retained axis range.
        instancer.instantiateVariableFont(variable_font, {"wght": (weight_min, weight_max)}, inplace=True)

        variable_font.flavor = "woff2"
        variable_font.save(output_path)
    finally:
        variable_font.close()


if __name__ == "__main__":
    main()
