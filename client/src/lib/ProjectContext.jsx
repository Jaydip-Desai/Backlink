import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiGet } from './api.js';

const ProjectContext = createContext(null);

export function useProject() {
  return useContext(ProjectContext);
}

export function ProjectProvider({ children }) {
  const [projects, setProjects] = useState([]);
  const [activeProject, setActiveProject] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadProjects = useCallback(async () => {
    try {
      const data = await apiGet('/projects').catch(() => []);
      if (Array.isArray(data) && data.length > 0) {
        const cleaned = data
          .map(p => ({
            ...p,
            name: String(p.name || 'LinkPilot Core').replace(/\s+HQ\b/gi, '').trim(),
          }))
          .sort((a, b) => Number(a.id || 0) - Number(b.id || 0));
        setProjects(cleaned);
        const savedId = localStorage.getItem('linkpilot_active_project_id');
        const found = cleaned.find(p => String(p.id) === savedId);
        setActiveProject(found || cleaned[0]);
      } else {
        // Fallback default project
        const defaultProj = {
          id: 1,
          name: 'LinkPilot Core',
          domain: 'linkpilot.io',
          website_url: 'https://linkpilot.io',
          total_backlinks: 3420,
          referring_domains: 642,
          broken_links: 8,
          risky_links: 14,
        };
        setProjects([defaultProj]);
        setActiveProject(defaultProj);
      }
    } catch {
      // fallback
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  const switchProject = (proj) => {
    setActiveProject(proj);
    if (proj?.id) {
      localStorage.setItem('linkpilot_active_project_id', String(proj.id));
    }
  };

  return (
    <ProjectContext.Provider
      value={{
        projects,
        activeProject,
        switchProject,
        reloadProjects: loadProjects,
        loading,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
}
