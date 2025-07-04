import './App.css';
import React, { useEffect, useState } from 'react';
import MDEditor from '@uiw/react-md-editor';
import '@uiw/react-md-editor/markdown-editor.css';
import '@uiw/react-markdown-preview/markdown.css';


let global_id: number = 0;

// Cell class
interface Cell {
    id: number;
    type: 'code' | 'mark';
}

function App() {
    const [cells, setCells] = useState<Cell[]>([]);

    const AddCodeCell = () => {
        setCells(prevCells => [
            ...prevCells,
            { id: global_id++, type: 'code' }
        ]);
    };

    const AddMarkCell = () => {
        setCells(prevCells => [
            ...prevCells,
            { id: global_id++, type: 'mark' }
        ]);
    };

    const DeleteCell = async (idToDelete: number) => {
        setCells(prevSnippets => prevSnippets.filter(snippet => snippet.id !== idToDelete));

        try {
            const response = await fetch(`http://127.0.0.1:8000/delete_context?id=${idToDelete}`, {
                method: 'POST',
            });
            if (!response.ok) {
                const errorData = await response.json();
                console.error(`Error deleting context for ID ${idToDelete}:`, errorData.detail || response.statusText);
            } else {
                console.log(`Context for ID ${idToDelete} deleted successfully.`);
            }
        } catch (error) {
            console.error(`Network or unexpected error while deleting context for ID ${idToDelete}:`, error);
        }
    };

    return (
        <>
            <h1>Your Notebook!</h1>
            <h6>not affiliated with Jupyter</h6>
            <button onClick={AddCodeCell}>Add Code Cell</button>
            <button onClick={AddMarkCell}>Add Text Cell</button>

            {cells.map(cell => (
                cell.type === 'code' ?
                    <CodeCell key={cell.id} id={cell.id} onDelete={DeleteCell} /> :
                    <MarkCell key={cell.id} id={cell.id} onDelete={DeleteCell} />
            ))}
        </>
    );
}

function CodeCell({ id, onDelete }: { id: number; onDelete: (id: number) => void }) {
    // Kept separate for initialization
    const [codeValue, setCodeValue] = useState<string>("# Python code goes here\nx = 1\ny = 2\nprint(f\"x = {x}\")\nprint(f\"y = {y}\")\nx + y");
    const [output, setOutput] = useState<string>("");
    const [isLoading, setIsLoading] = useState<boolean>(false);

    const runCode = async () => {
        setIsLoading(true);
        setOutput("Executing code...");

        try {
            const response = await fetch('http://127.0.0.1:8000/execute_code', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ id: id, code: codeValue }), // This correctly uses codeValue
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`HTTP error! Status: ${response.status} - ${errorData.detail || response.statusText}`);
            }

            const data = await response.json();
            setOutput(data.output || "No output received.");
            if (data.error) {
                setOutput(prev => prev + `\nError: ${data.error}`);
            }

        } catch (error) {
            console.error("Error executing code:", error);
            setOutput(`Error connecting to kernel or executing: ${error instanceof Error ? error.message : String(error)}`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="snippet codecell">
            <label> ID: {id} </label>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '5px' }}>
                <button onClick={() => onDelete(id)}>Delete</button>
                <button onClick={runCode} disabled={isLoading}>
                    {isLoading ? 'Running...' : 'Run code'}
                </button>
            </div>
            <br />
            <textarea
                value={codeValue} // Make value controlled by state
                onChange={(e) => setCodeValue(e.target.value)} // Update state on every input change
                rows={4}
                style={{ width: '100%', minHeight: '60px', fontFamily: 'monospace' }}
            />

            {output && (
                <pre className="code-output" style={{ backgroundColor: '#f0f0f0', padding: '10px', border: '1px solid #ddd', marginTop: '10px', whiteSpace: 'pre-wrap', wordBreak: 'break-all', maxHeight: '200px', overflowY: 'auto' }}>
                    {output}
                </pre>
            )}
        </div>
    );
}

function MarkCell({ id, onDelete }: { id: number; onDelete: (id: number) => void }) {
    const [markdownValue, setMarkdownValue] = useState<string>("**Hello!** Click to *edit* this markdown cell.");
    const [isEditing, setIsEditing] = useState<boolean>(false); // New state to manage edit mode

    return (
        <div className="snippet markcell">
            <label> ID: {id} </label>
            <button onClick={() => onDelete(id)}>Delete</button>

            {isEditing ? (
                // If in edit mode, show the MDEditor
                <>
                    <MDEditor
                        value={markdownValue}
                        onChange={(newValue?: string) => setMarkdownValue(newValue || "")}
                        height={200}
                    />
                    <button onClick={() => setIsEditing(false)}>Done Editing</button>
                </>
            ) : (
                // If not in edit mode, show the rendered markdown
                <div onClick={() => setIsEditing(true)} style={{ cursor: 'pointer', padding: '10px', border: '1px solid #ccc', minHeight: '50px' }}>
                    <MDEditor.Markdown source={markdownValue} />
                </div>
            )}
        </div>
    );
}

export default App;