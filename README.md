# Small Tools Made by Claude

## Tools

### Flake Nix Generator

Provides a starter `flake.nix` to be used with `nix develop` in the base of directories. Currently supports basic needs for python and node development.

### Bi-Directional JSON to Nix Converter

Frequently configuration data for applications is stored in JSON format. This performs a very naive conversion from JSON to Nix format, and back.

### jq Query Inspector and Builder

Entered JSON will have its schema generated. Selecting an element from the schema will generate the corresponding jq query. Supports querying arrays.

## Credits

I used [Claude Artifact Runner](https://github.com/claudio-silva/claude-artifact-runner) as template.

## License

This project is open source and available under the [MIT License](LICENSE).
