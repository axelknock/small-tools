import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

interface LanguageVersion {
  value: string;
  label: string;
}

interface Language {
  value: string;
  label: string;
  versions?: LanguageVersion[];
}

interface Library {
  value: string;
  label: string;
}

type Libraries = {
  [key: string]: Library[];
};

const languages: Language[] = [
  { 
    value: 'python', 
    label: 'Python',
    versions: [
      { value: 'python3', label: 'Python 3 (latest)' },
      { value: 'python39', label: 'Python 3.9' },
      { value: 'python310', label: 'Python 3.10' },
      { value: 'python311', label: 'Python 3.11' },
      { value: 'python312', label: 'Python 3.12' },
      { value: 'python313', label: 'Python 3.13' },
    ]
  },
  { 
    value: 'nodejs', 
    label: 'Node.js',
    versions: [
      { value: 'nodejs_18', label: 'Node.js 18' },
      { value: 'nodejs_20', label: 'Node.js 20' },
      { value: 'nodejs_22', label: 'Node.js 22' },
    ]
  },
  { value: 'rust', label: 'Rust' },
  { value: 'go', label: 'Go' },
];

const libraries: Libraries = {
  python: [
    { value: 'beautifulsoup4', label: 'BeautifulSoup4' },
    { value: 'matplotlib', label: 'Matplotlib' },
    { value: 'networkx', label: 'NetworkX' },
    { value: 'scipy', label: 'SciPy' },
    { value: 'python-dotenv', label: 'python-dotenv' },
    { value: 'requests', label: 'Requests' },
    { value: 'selenium', label: 'Selenium' },
    { value: 'pyvis', label: 'PyViz' },
  ],
  nodejs: [
    { value: 'express', label: 'Express' },
    { value: 'react', label: 'React' },
    { value: 'lodash', label: 'Lodash' },
    { value: 'typescript', label: 'TypeScript' },
    { value: 'webpack', label: 'Webpack' },
    { value: 'eslint', label: 'ESLint' },
  ],
  rust: [
    { value: 'serde', label: 'Serde' },
    { value: 'tokio', label: 'Tokio' },
    { value: 'rocket', label: 'Rocket' },
  ],
  go: [
    { value: 'gin', label: 'Gin' },
    { value: 'gorm', label: 'GORM' },
    { value: 'cobra', label: 'Cobra' },
  ],
};

export default function FlakeNixGenerator() {
  const [selectedLanguages, setSelectedLanguages] = useState([]);
  const [selectedVersions, setSelectedVersions] = useState({});
  const [selectedLibraries, setSelectedLibraries] = useState({});
  const [additionalPackages, setAdditionalPackages] = useState('');
  const [environmentVariables, setEnvironmentVariables] = useState('');
  const [flakeNix, setFlakeNix] = useState('');

  useEffect(() => {
    generateFlakeNix();
  }, [selectedLanguages, selectedVersions, selectedLibraries, additionalPackages, environmentVariables]);

  const generateFlakeNix = () => {
    let buildInputsContent = selectedLanguages.map(lang => {
      const langInfo = languages.find(l => l.value === lang);
      const version = selectedVersions[lang] || (langInfo.versions ? langInfo.versions[0].value : lang);
      if (lang === 'python') {
        const pythonLibs = selectedLibraries[lang] || [];
        return `
          # Python
          (${version}.withPackages (ps: with ps; [
            ${pythonLibs.join('\n            ')}
          ]))`;
      } else if (lang === 'nodejs') {
        const nodeLibs = (selectedLibraries[lang] || []).map(lib => `nodePackages.${lib}`);
        return `
          # Node.js
          ${version}
          ${nodeLibs.join('\n          ')}`;
      } else {
        const langPackages = {
          'rust': 'rustc cargo',
          'go': 'go',
        };
        const langLibs = selectedLibraries[lang] || [];
        return `
          # ${langInfo.label}
          ${langPackages[lang] || lang}
          ${langLibs.join('\n          ')}`;
      }
    }).join('\n');

    const envVars = environmentVariables
      .split('\n')
      .map(line => line.trim())
      .filter(line => line !== '')
      .map(line => `    export ${line};`)
      .join('\n');

    const shellHook = generateShellHook();

    let content = `
{
  description = "Development environment for ${selectedLanguages.map(lang => languages.find(l => l.value === lang)?.label).join(', ')}";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = import nixpkgs { inherit system; };
      in
      {
        devShell = pkgs.mkShell {
          buildInputs = with pkgs; [
            ${buildInputsContent}
            # Additional packages
            ${additionalPackages}
          ];

          shellHook = ''
            ${envVars}
            ${shellHook}
          '';
        };
      }
    );
}
`;
    setFlakeNix(content);
  };

  const generateShellHook = () => {
    let message = 'echo "Development shell initialized. You have access to these languages and libraries:"\n';
    selectedLanguages.forEach(lang => {
      const langInfo = languages.find(l => l.value === lang);
      const version = selectedVersions[lang] || (langInfo.versions ? langInfo.versions[0].value : lang);
      message += `    echo "* ${langInfo.label} (${version})"\n`;
      const libs = selectedLibraries[lang] || [];
      libs.forEach(lib => {
        message += `    echo "  - ${lib}"\n`;
      });
    });
    return message;
  };

  const handleLanguageChange = (value, checked) => {
    setSelectedLanguages(prev => 
      checked ? [...prev, value] : prev.filter(lang => lang !== value)
    );
    if (!checked) {
      setSelectedLibraries(prev => {
        const newLibraries = {...prev};
        delete newLibraries[value];
        return newLibraries;
      });
      setSelectedVersions(prev => {
        const newVersions = {...prev};
        delete newVersions[value];
        return newVersions;
      });
    }
  };

  const handleVersionChange = (language, version) => {
    setSelectedVersions(prev => ({
      ...prev,
      [language]: version
    }));
  };

  const handleLibraryChange = (language, value, checked) => {
    setSelectedLibraries(prev => ({
      ...prev,
      [language]: checked 
        ? [...(prev[language] || []), value]
        : (prev[language] || []).filter(lib => lib !== value)
    }));
  };

  return (
    <div className="p-4 max-w-2xl mx-auto">
    <details>
      <summary><h2 className="text-xl mb-4">Flake.nix Generator</h2></summary>
      <div className="space-y-4">
        <div>
          <label className="block mb-2">Select Languages:</label>
          <div className="space-y-2">
            {languages.map((lang) => (
              <div key={lang.value} className="flex items-center space-x-2">
                <Checkbox 
                  id={`lang-${lang.value}`}
                  checked={selectedLanguages.includes(lang.value)}
                  onCheckedChange={(checked) => handleLanguageChange(lang.value, checked)}
                />
                <Label htmlFor={`lang-${lang.value}`}>{lang.label}</Label>
                {lang.versions && selectedLanguages.includes(lang.value) && (
                  <Select
                    value={selectedVersions[lang.value] || lang.versions[0].value}
                    onValueChange={(version) => handleVersionChange(lang.value, version)}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Select version" />
                    </SelectTrigger>
                    <SelectContent>
                      {lang.versions.map((version) => (
                        <SelectItem key={version.value} value={version.value}>
                          {version.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            ))}
          </div>
        </div>
        {selectedLanguages.map(lang => (
          <div key={lang}>
            <label className="block mb-2">Select {languages.find(l => l.value === lang)?.label} Libraries:</label>
            <div className="space-y-2">
              {libraries[lang].map((lib) => (
                <div key={lib.value} className="flex items-center space-x-2">
                  <Checkbox 
                    id={`${lang}-${lib.value}`}
                    checked={(selectedLibraries[lang] || []).includes(lib.value)}
                    onCheckedChange={(checked) => handleLibraryChange(lang, lib.value, checked)}
                  />
                  <Label htmlFor={`${lang}-${lib.value}`}>{lib.label}</Label>
                </div>
              ))}
            </div>
          </div>
        ))}
        <div>
          <label className="block mb-2">Additional Packages:</label>
          <Input
            value={additionalPackages}
            onChange={(e) => setAdditionalPackages(e.target.value)}
            placeholder="Enter package names separated by spaces"
          />
        </div>
        <div>
          <label className="block mb-2">Environment Variables:</label>
          <Textarea
            value={environmentVariables}
            onChange={(e) => setEnvironmentVariables(e.target.value)}
            placeholder="Enter environment variables (one per line, e.g., VAR_NAME=value)"
            rows={4}
          />
        </div>
        <div>
          <h2 className="text-xl font-semibold mb-2">Generated flake.nix:</h2>
          <pre className="bg-gray-100 p-4 rounded overflow-x-auto">
            <code>{flakeNix}</code>
          </pre>
        </div>
        <Button onClick={() => navigator.clipboard.writeText(flakeNix)}>
          Copy to Clipboard
        </Button>
      </div>
    </details>
    </div>
  );
}
