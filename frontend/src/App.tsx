import './App.css';
import React, { useState } from 'react';
import MDEditor from '@uiw/react-md-editor';
import '@uiw/react-md-editor/markdown-editor.css';
import '@uiw/react-markdown-preview/markdown.css';

// Define the type for a snippet object (this part remains the same)
interface Cell {
    id: number;
    type: 'code' | 'mark';
}

function App() {
    const [cells, setCells] = useState<Cell[]>([]);

    const AddCodeCell = () => {
        setCells(prevCells => [
            ...prevCells,
            { id: Date.now(), type: 'code' }
        ]);
    };

    const AddMarkCell = () => {
        setCells(prevCells => [
            ...prevCells,
            { id: Date.now(), type: 'mark' }
        ]);
    };

    const DeleteCell = (idToDelete: number) => {
        setCells(prevSnippets => prevSnippets.filter(snippet => snippet.id !== idToDelete));
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
    const sampleCode: string = '#my example code\nprint(5)';
    
    return (
        <div className="snippet codecell">
            <label> ID: {id} </label>
            <button onClick={() => onDelete(id)}>Delete</button>
            <button>Run code</button>
            <br />
            <textarea defaultValue={sampleCode} />
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