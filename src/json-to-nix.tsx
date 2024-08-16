import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

const BidirectionalConverter = () => {
  const [jsonc, setJsonC] = useState('{\n  // This is a comment\n  "key": "value",\n  "number": 42,\n  "array": [1, 2, 3],\n  "nested": {\n    "foo": "bar"\n  },\n  "numbers": [\n    {\n      "something": false\n    }\n  ]\n}');
  const [nix, setNix] = useState('');
  const [editingJsonc, setEditingJsonc] = useState(true);

  const convertJSONCToNix = (jsonc) => {
    const json = jsonc.replace(/\/\/.*|\/\*[\s\S]*?\*\//g, '');
    try {
      const obj = JSON.parse(json);
      return jsonToNix(obj);
    } catch (error) {
      return `Error: ${error.message}`;
    }
  };

  const jsonToNix = (obj, indent = 0) => {
    const spaces = '  '.repeat(indent);
    if (typeof obj === 'string') return `"${obj}"`;
    if (typeof obj === 'number' || typeof obj === 'boolean') return obj.toString();
    if (Array.isArray(obj)) {
      if (obj.length === 0) return "[ ]";
      const items = obj.map(item => jsonToNix(item, indent + 1)).join("\n" + spaces + "  ");
      return `[\n${spaces}  ${items}\n${spaces}]`;
    }
    if (typeof obj === 'object' && obj !== null) {
      if (Object.keys(obj).length === 0) return "{ }";
      const entries = Object.entries(obj).map(([key, value]) => 
        `${spaces}  ${key} = ${jsonToNix(value, indent + 1)};`
      ).join('\n');
      return `{\n${entries}\n${spaces}}`;
    }
    return 'null';
  };

  const convertNixToJSONC = (nix) => {
    try {
      const obj = nixToJson(nix);
      return JSON.stringify(obj, null, 2);
    } catch (error) {
      return `Error: ${error.message}`;
    }
  };

  const nixToJson = (nix) => {
    const trimmed = nix.trim();
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      return parseNixObject(trimmed);
    }
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      return parseNixArray(trimmed);
    }
    if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
      return trimmed.slice(1, -1);
    }
    if (trimmed === 'true') return true;
    if (trimmed === 'false') return false;
    if (!isNaN(trimmed)) return Number(trimmed);
    return trimmed;
  };

  const parseNixObject = (nix) => {
    const inner = nix.slice(1, -1).trim();
    const result = {};
    let key = '';
    let value = '';
    let depth = 0;
    let inKey = true;

    for (let i = 0; i < inner.length; i++) {
      const char = inner[i];
      if (char === '{' || char === '[') depth++;
      if (char === '}' || char === ']') depth--;
      if (char === '=' && depth === 0 && inKey) {
        inKey = false;
        continue;
      }
      if (char === ';' && depth === 0 && !inKey) {
        result[key.trim()] = nixToJson(value.trim());
        key = '';
        value = '';
        inKey = true;
        continue;
      }
      if (inKey) key += char;
      else value += char;
    }
    if (key && value) {
      result[key.trim()] = nixToJson(value.trim());
    }
    return result;
  };

  const parseNixArray = (nix) => {
    const inner = nix.slice(1, -1).trim();
    if (inner === "") return [];
    
    const result = [];
    let current = '';
    let depth = 0;

    for (let i = 0; i < inner.length; i++) {
      const char = inner[i];
      if (char === '{' || char === '[') depth++;
      if (char === '}' || char === ']') depth--;
      
      if ((char === ' ' || char === '\n') && depth === 0) {
        if (current.trim()) {
          result.push(nixToJson(current.trim()));
          current = '';
        }
      } else {
        current += char;
      }
    }
    
    if (current.trim()) {
      result.push(nixToJson(current.trim()));
    }
    
    return result;
  };

  useEffect(() => {
    if (editingJsonc) {
      setNix(convertJSONCToNix(jsonc));
    } else {
      setJsonC(convertNixToJSONC(nix));
    }
  }, [jsonc, nix, editingJsonc]);

  const handleJsoncChange = (e) => {
    setJsonC(e.target.value);
  };

  const handleNixChange = (e) => {
    setNix(e.target.value);
  };

  return (
    <div className="p-4 w-full flex flex-col">
      <details>
        <summary><h2 className='text-xl'>Bidirectional JSON to Nix Converter</h2></summary>
      <div className="pt-8 mb-4 flex justify-center">
        <Button onClick={() => setEditingJsonc(!editingJsonc)}>
          {editingJsonc ? 'Edit Nix' : 'Edit JSONC'}
        </Button>
      </div>
      <div className="flex flex-1 space-x-4">
        <div className="flex-1 flex flex-col">
          <label className="mb-2 font-bold">JSONC</label>
          {editingJsonc ? (
            <Textarea
              value={jsonc}
              onChange={handleJsoncChange}
              placeholder="Enter JSONC here..."
              className="flex-1 font-mono resize-none"
            />
          ) : (
            <pre className="flex-1 p-2 bg-gray-100 border rounded overflow-auto font-mono whitespace-pre-wrap">
              {jsonc}
            </pre>
          )}
        </div>
        <div className="flex-1 flex flex-col">
          <label className="mb-2 font-bold">Nix</label>
          {editingJsonc ? (
            <pre className="flex-1 p-2 bg-gray-100 border rounded overflow-auto font-mono whitespace-pre-wrap">
              {nix}
            </pre>
          ) : (
            <Textarea
              value={nix}
              onChange={handleNixChange}
              className="flex-1 font-mono resize-none"
            />
          )}
        </div>
      </div>
      </details>
    </div>
  );
};

export default BidirectionalConverter;
