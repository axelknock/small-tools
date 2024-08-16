import React, { useState, useEffect } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Copy } from 'lucide-react';

const JqBuilder = () => {
  const [jsonInput, setJsonInput] = useState('');
  const [schema, setSchema] = useState(null);
  const [parsedJson, setParsedJson] = useState(null);
  const [error, setError] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('');
  const [queryResult, setQueryResult] = useState('');
  const [copiedFilter, setCopiedFilter] = useState(false);
  const [copiedResult, setCopiedResult] = useState(false);

  useEffect(() => {
    if (jsonInput) {
      parseJson(jsonInput);
    }
  }, [jsonInput]);

  useEffect(() => {
    if (parsedJson && selectedFilter) {
      try {
        const result = applyFilter(parsedJson, selectedFilter);
        setQueryResult(JSON.stringify(result, null, 2));
        setError('');
      } catch (e) {
        setError('Filter error: ' + e.message);
        setQueryResult('');
      }
    } else {
      setQueryResult('');
    }
  }, [parsedJson, selectedFilter]);

  const parseJson = (input) => {
    try {
      const parsed = JSON.parse(input);
      setParsedJson(parsed);
      const simplifiedSchema = simplifySchema(parsed);
      setSchema(simplifiedSchema);
      setError('');
    } catch (e) {
      setError('Invalid JSON: ' + e.message);
      setSchema(null);
      setParsedJson(null);
    }
  };

  const simplifySchema = (data, path = []) => {
    if (Array.isArray(data)) {
      if (data.length === 0) return { type: 'array', items: 'unknown', count: 0 };
      const sample = simplifySchema(data[0], [...path, 0]);
      return { type: 'array', items: sample, count: data.length };
    } else if (typeof data === 'object' && data !== null) {
      const result = {};
      for (const [key, value] of Object.entries(data)) {
        result[key] = simplifySchema(value, [...path, key]);
      }
      return result;
    } else {
      return { type: typeof data };
    }
  };

  const generateJqFilter = (path) => {
    return path.reduce((filter, part, index) => {
      if (typeof part === 'number') {
        return `${filter}[${part}]`;
      }
      return index === 0 ? part : `${filter}.${part}`;
    }, '');
  };

  const handleFilterClick = (filter) => {
    setSelectedFilter(filter);
  };

  const handleFilterChange = (e) => {
    setSelectedFilter(e.target.value);
  };

  const applyFilter = (data, filter) => {
    if (!filter.startsWith('.')) {
      filter = '.' + filter;
    }
    const parts = filter.match(/[^.\[\]]+|\[.*?\]|\[\]/g) || [];
    
    const applyParts = (current, remainingParts) => {
      if (remainingParts.length === 0) {
        return current;
      }

      const [part, ...rest] = remainingParts;

      if (part === '[]') {
        if (!Array.isArray(current)) {
          throw new Error('Attempting to use [] on a non-array');
        }
        return current.map(item => applyParts(item, rest));
      } else if (part.startsWith('[') && part.endsWith(']')) {
        const index = part.slice(1, -1);
        if (index === '') {
          if (!Array.isArray(current)) {
            throw new Error('Attempting to use [] on a non-array');
          }
          return current.map(item => applyParts(item, rest));
        }
        const parsedIndex = parseInt(index);
        if (isNaN(parsedIndex)) {
          throw new Error('Invalid array index');
        }
        if (!Array.isArray(current)) {
          throw new Error('Attempting to index a non-array');
        }
        return applyParts(current[parsedIndex], rest);
      } else {
        if (current === null || typeof current !== 'object') {
          throw new Error(`Cannot access property '${part}' of ${current}`);
        }
        return applyParts(current[part], rest);
      }
    };

    return applyParts(data, parts);
  };

  const renderSchemaItem = (item, path = [], depth = 0) => {
    const indent = '  '.repeat(depth);
    
    if (item.type === 'array') {
      return (
        <div>
          <span 
            className="cursor-pointer text-purple-500 hover:underline"
            onClick={() => handleFilterClick(generateJqFilter(path) + '[]')}
          >
            {`${indent}# Array (${item.count} items)`}
          </span>
          <div>{renderSchemaItem(item.items, [...path, 0], depth + 1)}</div>
        </div>
      );
    } else if (typeof item === 'object' && !item.type) {
      return (
        <div>
          <span 
            className="cursor-pointer text-blue-500 hover:underline"
            onClick={() => handleFilterClick(generateJqFilter(path))}
          >
            {`${indent}# Object`}
          </span>
          {Object.entries(item).map(([key, value]) => (
            <div key={key}>
              <span 
                className="cursor-pointer text-blue-500 hover:underline"
                onClick={() => handleFilterClick(generateJqFilter([...path, key]))}
              >
                {`${indent}${key}:`}
              </span>{' '}
              {renderSchemaItem(value, [...path, key], depth + 1)}
            </div>
          ))}
        </div>
      );
    } else {
      return (
        <span 
          className="cursor-pointer text-green-500 hover:underline"
          onClick={() => handleFilterClick(generateJqFilter(path))}
        >
          {item.type}
        </span>
      );
    }
  };

  const copyToClipboard = (text, setCopied) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="p-4 space-y-4">
      <details>
        <summary><h2 className='text-xl'>JQ Builder and Inspector</h2></summary>
        <div style={{paddingBottom:"10px"}}>        
          <textarea
            className="w-full p-2 border rounded"
            rows="10"
            value={jsonInput}
            onChange={(e) => setJsonInput(e.target.value)}
            placeholder="Paste your JSON here"
          />
          
          <div className="bg-gray-100 p-4 rounded relative">
            <h3 className="text-lg font-semibold mb-2">jq Filter (editable):</h3>
            <input
              type="text"
              className="w-full p-2 border rounded"
              value={selectedFilter}
              onChange={handleFilterChange}
              placeholder="Enter or modify jq filter"
            />
            <button
              className="absolute top-2 right-2 p-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
              onClick={() => copyToClipboard(selectedFilter, setCopiedFilter)}
              title="Copy filter"
            >
              <Copy size={16} />
            </button>
            {copiedFilter && <span className="absolute top-2 right-12 text-sm text-green-600">Copied!</span>}
          </div>

          <div className="bg-gray-100 p-4 rounded relative">
            <h3 className="text-lg font-semibold mb-2">Query Result:</h3>
            <pre className="bg-white p-2 rounded overflow-auto max-h-40">
              {queryResult || 'No result yet'}
            </pre>
            <button
              className="absolute top-2 right-2 p-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
              onClick={() => copyToClipboard(queryResult, setCopiedResult)}
              title="Copy result"
            >
              <Copy size={16} />
            </button>
            {copiedResult && <span className="absolute top-2 right-12 text-sm text-green-600">Copied!</span>}
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {schema && (
            <div>
              <h2 className="text-xl font-bold mb-2">Simplified Schema (click to generate jq filter):</h2>
              <pre className="bg-gray-100 p-4 rounded">
                {renderSchemaItem(schema)}
              </pre>
            </div>
          )}
        </div>
      </details>
    </div>
  );
};

export default JqBuilder;
