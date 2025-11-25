
import React, { useState, useEffect, useRef } from 'react';
import { getUserProjects, deleteProject, updateProjectTitle } from '../services/supabaseClient.js';
import { FolderIcon, FileIcon, MoreVerticalIcon, TrashIcon, EditIcon, PlusIcon, Spinner, ChevronRightIcon } from './Shared.js';
import { AppView } from '../constants.js';

const ProjectManager = ({ onSelectProject, onNewProject, currentUser }) => {
    const [projects, setProjects] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [renamingId, setRenamingId] = useState(null);
    const [renameValue, setRenameValue] = useState('');
    const [openMenuId, setOpenMenuId] = useState(null);
    const [error, setError] = useState(null);
    const menuRef = useRef(null);

    useEffect(() => {
        const fetchProjects = async () => {
            if (currentUser) {
                setIsLoading(true);
                try {
                    const data = await getUserProjects();
                    setProjects(data);
                } catch (err) {
                    setError('Failed to load projects');
                } finally {
                    setIsLoading(false);
                }
            }
        };
        fetchProjects();
    }, [currentUser]);

    // Close context menu on outside click
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setOpenMenuId(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleDelete = async (id, e) => {
        e.stopPropagation();
        if (window.confirm("Are you sure you want to delete this project? This action cannot be undone.")) {
            try {
                await deleteProject(id);
                setProjects(prev => prev.filter(p => p.id !== id));
                setOpenMenuId(null);
            } catch (err) {
                alert("Failed to delete project");
            }
        }
    };

    const startRenaming = (project, e) => {
        e.stopPropagation();
        setRenamingId(project.id);
        setRenameValue(project.title);
        setOpenMenuId(null);
    };

    const handleRenameSubmit = async (id) => {
        if (!renameValue.trim()) return;
        try {
            await updateProjectTitle(id, renameValue);
            setProjects(prev => prev.map(p => p.id === id ? { ...p, title: renameValue } : p));
            setRenamingId(null);
        } catch (err) {
            alert("Failed to rename project");
        }
    };

    const handleKeyDown = (e, id) => {
        if (e.key === 'Enter') handleRenameSubmit(id);
        if (e.key === 'Escape') setRenamingId(null);
    };

    return React.createElement('div', { className: 'flex flex-col h-full bg-dark-bg animate-fade-in-up' },
        // Top Bar
        React.createElement('div', { className: 'flex items-center justify-between px-8 py-6 border-b border-dark-border bg-dark-card/50' },
            React.createElement('div', { className: 'flex items-center gap-2 text-sm text-brand-text-light' },
                React.createElement('span', { className: 'text-slate-400' }, "Main"),
                React.createElement(ChevronRightIcon, { className: 'w-4 h-4' }),
                React.createElement('span', { className: 'text-white font-medium' }, "Projects")
            ),
            React.createElement('button', {
                onClick: onNewProject,
                className: 'flex items-center gap-2 px-4 py-2 bg-button-gradient text-white rounded-lg font-semibold shadow-lg shadow-brand-purple/20 hover:opacity-90 transition-all'
            },
                React.createElement(PlusIcon, { className: 'w-5 h-5' }),
                "New Project"
            )
        ),

        // Content Area
        React.createElement('div', { className: 'flex-grow p-8 overflow-y-auto' },
            isLoading ? (
                React.createElement('div', { className: 'flex justify-center items-center h-64' },
                    React.createElement(Spinner, { size: '10' })
                )
            ) : projects.length === 0 ? (
                React.createElement('div', { className: 'flex flex-col items-center justify-center h-64 text-slate-500' },
                    React.createElement(FolderIcon, { className: 'w-16 h-16 mb-4 opacity-50' }),
                    React.createElement('p', null, "No projects yet. Create one to get started!")
                )
            ) : (
                React.createElement('div', { className: 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6' },
                    projects.map(project => 
                        React.createElement('div', {
                            key: project.id,
                            onClick: () => onSelectProject(project.id),
                            className: 'group relative bg-dark-card-solid border border-dark-border rounded-xl p-4 hover:bg-white/5 hover:border-brand-purple/50 transition-all cursor-pointer flex flex-col items-center text-center'
                        },
                            // Folder Icon
                            React.createElement('div', { className: 'w-16 h-16 mb-3 text-brand-purple-light opacity-80 group-hover:opacity-100 transition-opacity' },
                                React.createElement(FolderIcon, { className: 'w-full h-full' })
                            ),
                            
                            // Title or Rename Input
                            renamingId === project.id ? (
                                React.createElement('input', {
                                    type: 'text',
                                    value: renameValue,
                                    onChange: (e) => setRenameValue(e.target.value),
                                    onBlur: () => handleRenameSubmit(project.id),
                                    onKeyDown: (e) => handleKeyDown(e, project.id),
                                    autoFocus: true,
                                    onClick: (e) => e.stopPropagation(),
                                    className: 'w-full bg-dark-bg border border-brand-purple rounded px-2 py-1 text-sm text-center text-white focus:outline-none'
                                })
                            ) : (
                                React.createElement('h3', { className: 'text-white font-medium truncate w-full px-2 mb-1' }, project.title || "Untitled")
                            ),
                            
                            React.createElement('p', { className: 'text-xs text-slate-500' }, new Date(project.updated_at).toLocaleDateString()),

                            // Kebab Menu Button
                            React.createElement('button', {
                                onClick: (e) => { e.stopPropagation(); setOpenMenuId(openMenuId === project.id ? null : project.id); },
                                className: `absolute top-2 right-2 p-1 rounded-full text-slate-400 hover:text-white hover:bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity ${openMenuId === project.id ? 'opacity-100' : ''}`
                            }, React.createElement(MoreVerticalIcon, null)),

                            // Context Menu
                            openMenuId === project.id && React.createElement('div', {
                                ref: menuRef,
                                className: 'absolute top-8 right-2 w-32 bg-dark-bg border border-dark-border rounded-lg shadow-xl z-10 py-1 animate-fade-in-up'
                            },
                                React.createElement('button', {
                                    onClick: (e) => startRenaming(project, e),
                                    className: 'w-full flex items-center gap-2 px-4 py-2 text-sm text-left text-slate-300 hover:bg-white/10 hover:text-white'
                                }, React.createElement(EditIcon, { className: 'w-4 h-4' }), "Rename"),
                                React.createElement('button', {
                                    onClick: (e) => handleDelete(project.id, e),
                                    className: 'w-full flex items-center gap-2 px-4 py-2 text-sm text-left text-red-400 hover:bg-red-500/10'
                                }, React.createElement(TrashIcon, { className: 'w-4 h-4' }), "Delete")
                            )
                        )
                    )
                )
            )
        )
    );
};

export default ProjectManager;
