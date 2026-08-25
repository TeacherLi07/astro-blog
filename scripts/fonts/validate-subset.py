import hashlib
import json
import sys
import unicodedata
from pathlib import Path

from fontTools.ttLib import TTFont


def main() -> None:
    if len(sys.argv) != 3:
        raise SystemExit("usage: validate-subset.py MANIFEST CHARSET")

    manifest_path = Path(sys.argv[1])
    charset_path = Path(sys.argv[2])
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    characters = charset_path.read_text(encoding="utf8")
    font_path = Path("public") / manifest["publicPath"].lstrip("/")
    expected_output_sha256 = manifest["outputSha256"]
    actual_output_sha256 = hashlib.sha256(font_path.read_bytes()).hexdigest()

    if actual_output_sha256 != expected_output_sha256:
        raise SystemExit(
            f"Output SHA256 mismatch: expected {expected_output_sha256}, "
            f"got {actual_output_sha256}"
        )

    font = TTFont(font_path, lazy=True)
    try:
        axes = {
            axis.axisTag: (axis.minValue, axis.defaultValue, axis.maxValue)
            for axis in font["fvar"].axes
        }
        cmap = font.getBestCmap()
        feature_tags = {
            record.FeatureTag
            for record in font["GSUB"].table.FeatureList.FeatureRecord
        }

        missing = [
            character
            for character in dict.fromkeys(characters)
            if ord(character) >= 0x20
            and unicodedata.category(character) != "Cf"
            and ord(character) not in cmap
        ]

        if axes != {"wght": (100, 400, 800)}:
            raise SystemExit(f"Unexpected variable axes: {axes}")
        if missing:
            preview = "".join(missing[:30])
            raise SystemExit(f"Missing {len(missing)} characters: {preview}")
        if "calt" not in feature_tags:
            raise SystemExit("Required feature calt is missing")
        if "cv01" in feature_tags:
            raise SystemExit("Disabled feature cv01 was retained")
    finally:
        font.close()

    print(
        f"Validated subset: {len(cmap)} cmap entries, "
        f"{manifest['charsetCount']} source characters, "
        f"wght 100-400-800"
    )


if __name__ == "__main__":
    main()
