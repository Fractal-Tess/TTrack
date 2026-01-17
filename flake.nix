{
  description = "A development environment for Node.js";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixpkgs-unstable";
    systems.url = "github:nix-systems/default";
    playwright.url = "github:pietdevries94/playwright-web-flake";
  };

  outputs =
    {
      nixpkgs,
      systems,
      playwright,
      ...
    }:
    let
      eachSystem =
        f:
        nixpkgs.lib.genAttrs (import systems) (
          system:
          let
            overlay = final: prev: {
              inherit (playwright.packages.${system}) playwright-test playwright-driver;
            };
            pkgs = import nixpkgs {
              inherit system;
              overlays = [ overlay ];
            };
          in
          f pkgs
        );
    in
    {
      devShells = eachSystem (pkgs: {
        default = pkgs.mkShell {
          shellHook = ''
            export PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
            export PLAYWRIGHT_BROWSERS_PATH="${pkgs.playwright-driver.browsers}"
            export LD_LIBRARY_PATH="${
              pkgs.lib.makeLibraryPath [
                pkgs.stdenv.cc.cc.lib
                pkgs.vips
              ]
            }:$LD_LIBRARY_PATH"
            echo "
                   _______
                  / / ___/
             __  / /\__ \\
            / /_/ /___/ /
            \\____//____/
            Bun - $(${pkgs.bun}/bin/bun --version)
                        " | ${pkgs.lolcat}/bin/lolcat
          '';
          packages = with pkgs; [

            # Node.js (specified by overlay)
            bun
            # deno
            # node

            # bun
            #yarn

            # Playwright
            playwright-test

            # Native dependencies for sharp
            vips
          ];
        };
      });
    };
}
