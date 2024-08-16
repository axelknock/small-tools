{
  description = "Development environment for Node.js";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = {
    self,
    nixpkgs,
    flake-utils,
  }:
    flake-utils.lib.eachDefaultSystem (
      system: let
        pkgs = import nixpkgs {inherit system;};
      in {
        devShell = pkgs.mkShell {
          buildInputs = with pkgs; [
            # Node.js
            nodejs_20
            # Additional packages
            wrangler
          ];

          shellHook = ''

                    echo "Development shell initialized. You have access to these languages and libraries:"
            echo "* Node.js (nodejs_20)"
            echo "  - react"

          '';
        };
      }
    );
}
