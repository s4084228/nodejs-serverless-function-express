// services/utils/ProjectSupabase.ts

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.TOC_SUPABASE_URL!,
    process.env.TOC_SUPABASE_SERVICE_ROLE_KEY!
);

// Project CRUD operations
export async function createProject(projectData: {
    userId: number;
    name: string;
    description?: string;
}): Promise<any> {
    try {
        const { data, error } = await supabase
            .from('Projects')
            .insert({
                user_id: projectData.userId,
                name: projectData.name,
                description: projectData.description,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error creating project:', error);
        throw new Error('Failed to create project');
    }
}

export async function findProjectById(projectId: number): Promise<any | null> {
    try {
        const { data, error } = await supabase
            .from('Projects')
            .select('*')
            .eq('project_id', projectId)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return null;
            }
            throw error;
        }

        return data;
    } catch (error) {
        console.error('Error finding project:', error);
        throw new Error('Failed to find project');
    }
}

export async function findProjectsByUserId(userId: number): Promise<any[]> {
    try {
        const { data, error } = await supabase
            .from('Projects')
            .select('*')
            .eq('user_id', userId)
            .order('updated_at', { ascending: false });

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Error finding projects by user:', error);
        throw new Error('Failed to find projects');
    }
}

export async function updateProject(
    projectId: number,
    updates: {
        name?: string;
        description?: string;
    }
): Promise<any> {
    try {
        const { data, error } = await supabase
            .from('Projects')
            .update({
                ...updates,
                updated_at: new Date().toISOString()
            })
            .eq('project_id', projectId)
            .select()
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error updating project:', error);
        throw new Error('Failed to update project');
    }
}

export async function deleteProject(projectId: number): Promise<void> {
    try {
        const { error } = await supabase
            .from('Projects')
            .delete()
            .eq('project_id', projectId);

        if (error) throw error;
    } catch (error) {
        console.error('Error deleting project:', error);
        throw new Error('Failed to delete project');
    }
}

// TOC Diagram operations
export async function createTocDiagram(diagramData: {
    projectId: number;
    name: string;
    diagramData?: any;
}): Promise<any> {
    try {
        const { data, error } = await supabase
            .from('TocDiagrams')
            .insert({
                project_id: diagramData.projectId,
                name: diagramData.name,
                diagram_data: diagramData.diagramData || {},
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error creating TOC diagram:', error);
        throw new Error('Failed to create TOC diagram');
    }
}

export async function findTocDiagramById(diagramId: number): Promise<any | null> {
    try {
        const { data, error } = await supabase
            .from('TocDiagrams')
            .select('*')
            .eq('diagram_id', diagramId)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return null;
            }
            throw error;
        }

        return data;
    } catch (error) {
        console.error('Error finding TOC diagram:', error);
        throw new Error('Failed to find TOC diagram');
    }
}

export async function findTocDiagramsByProjectId(projectId: number): Promise<any[]> {
    try {
        const { data, error } = await supabase
            .from('TocDiagrams')
            .select('*')
            .eq('project_id', projectId)
            .order('updated_at', { ascending: false });

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Error finding TOC diagrams by project:', error);
        throw new Error('Failed to find TOC diagrams');
    }
}

export async function updateTocDiagram(
    diagramId: number,
    updates: {
        name?: string;
        diagramData?: any;
    }
): Promise<any> {
    try {
        const { data, error } = await supabase
            .from('TocDiagrams')
            .update({
                name: updates.name,
                diagram_data: updates.diagramData,
                updated_at: new Date().toISOString()
            })
            .eq('diagram_id', diagramId)
            .select()
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error updating TOC diagram:', error);
        throw new Error('Failed to update TOC diagram');
    }
}

export async function deleteTocDiagram(diagramId: number): Promise<void> {
    try {
        const { error } = await supabase
            .from('TocDiagrams')
            .delete()
            .eq('diagram_id', diagramId);

        if (error) throw error;
    } catch (error) {
        console.error('Error deleting TOC diagram:', error);
        throw new Error('Failed to delete TOC diagram');
    }
}

// Get project with all diagrams
export async function getProjectWithDiagrams(projectId: number): Promise<any | null> {
    try {
        const { data, error } = await supabase
            .from('Projects')
            .select(`
        *,
        diagrams:TocDiagrams(*)
      `)
            .eq('project_id', projectId)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return null;
            }
            throw error;
        }

        return data;
    } catch (error) {
        console.error('Error getting project with diagrams:', error);
        throw new Error('Failed to get project with diagrams');
    }
}