import { MongoClient, Db, Collection } from 'mongodb';
import  CreateProjectRequest  from '../services/entities/project/CreateProjectRequest'
import  GetProjectsRequest  from '../services/entities/project/GetProjectsRequest'
import  ProjectData  from '../services/entities/project/ProjectData'
import UpdateProjectRequest from "../services/entities/project/UpdateProjectRequest"

export class ProjectService {
    private static client: MongoClient | null = null;
    private static db: Db | null = null;

    private static async getDatabase(): Promise<{ db: Db; collection: Collection }> {
        if (!this.client) {
            const uri = process.env.MONGODB_URI;
            if (!uri) {
                throw new Error('MONGODB_URI environment variable is not set');
            }
            this.client = new MongoClient(uri);
            await this.client.connect();
            this.db = this.client.db('myFirstDatabase');
        }
        const collection = this.db!.collection('projects');
        return { db: this.db!, collection };
    }

    static getDefaultTocColor(): any {
        const defaultSection = { shape: "", text: "" };
        return {
            bigPictureGoal: defaultSection,
            projectAim: defaultSection,
            activities: defaultSection,
            objectives: defaultSection,
            beneficiaries: defaultSection,
            outcomes: defaultSection,
            externalFactors: defaultSection,
            evidenceLinks: defaultSection
        };
    }

    static validateTocColorFormat(tocColor: any): boolean {
        if (!tocColor || typeof tocColor !== 'object') return false;

        const validSections = [
            'bigPictureGoal', 'projectAim', 'activities', 'objectives',
            'beneficiaries', 'outcomes', 'externalFactors', 'evidenceLinks'
        ];

        for (const section of Object.keys(tocColor)) {
            if (!validSections.includes(section)) continue;
            
            const sectionData = tocColor[section];
            if (!sectionData || typeof sectionData !== 'object') return false;
            
            // Check if shape and text properties exist (can be empty strings)
            if (!sectionData.hasOwnProperty('shape') || !sectionData.hasOwnProperty('text')) {
                return false;
            }
        }

        return true;
    }

    static validateCreateRequest(data: any): string[] {
        const errors: string[] = [];
        if (!data.projectTitle) errors.push('projectTitle is required');
        
        // Validate tocColor format if provided
        if (data.tocColor && !this.validateTocColorFormat(data.tocColor)) {
            errors.push('tocColor format is invalid');
        }
        
        return errors;
    }

    static validateUpdateRequest(data: any): string[] {
        const errors: string[] = [];
        if (!data.projectId) errors.push('projectId is required');
        if (!data.projectTitle) errors.push('projectTitle is required');
        
        // Validate tocColor format if provided
        if (data.tocColor && !this.validateTocColorFormat(data.tocColor)) {
            errors.push('tocColor format is invalid');
        }
        
        return errors;
    }

    static async generateUniqueProjectId(userId: string): Promise<string> {
        try {
            const { collection } = await this.getDatabase();

            const projects = await collection
                .find({ userId: userId })
                .project({ projectId: 1 })
                .toArray();

            const existingIds = projects
                .map(p => parseInt(p.projectId))
                .filter(id => !isNaN(id))
                .sort((a, b) => b - a);

            const nextId = existingIds.length > 0 ? existingIds[0] + 1 : 1;
            return nextId.toString();
        } catch (error) {
            console.error('Error generating project ID:', error);
            return '1';
        }
    }

    static async checkProjectTitleExists(userId: string, projectTitle: string, excludeProjectId?: string): Promise<boolean> {
        try {
            const { collection } = await this.getDatabase();

            const query: any = {
                userId: userId,
                projectTitle: { $regex: new RegExp(`^${projectTitle}$`, 'i') }
            };

            if (excludeProjectId) {
                query.projectId = { $ne: excludeProjectId };
            }

            const existing = await collection.findOne(query);
            return existing !== null;
        } catch (error) {
            console.error('Error checking project title:', error);
            return false;
        }
    }

    static async getProjectById(userId: string, projectId: string): Promise<ProjectData | null> {
        try {
            const { collection } = await this.getDatabase();

            const doc = await collection.findOne({
                userId: userId,
                projectId: projectId
            });

            if (!doc) return null;

            // Transform document to match flat ProjectData structure
            return {
                projectId: doc.projectId,
                status: doc.status,
                type: doc.type,
                createdAt: doc.createdAt,
                updatedAt: doc.updatedAt,
                tocData: {
                    projectTitle: doc.tocData?.projectTitle || doc.projectTitle,
                    bigPictureGoal: doc.tocData?.bigPictureGoal,
                    projectAim: doc.tocData?.projectAim,
                    objectives: doc.tocData?.objectives,
                    beneficiaries: doc.tocData?.beneficiaries,
                    activities: doc.tocData?.activities,
                    outcomes: doc.tocData?.outcomes,
                    externalFactors: doc.tocData?.externalFactors,
                    evidenceLinks: doc.tocData?.evidenceLinks
                },
                tocColor: doc.tocColor || this.getDefaultTocColor()
            } as ProjectData;
        } catch (error) {
            console.error('Error getting project:', error);
            return null;
        }
    }

    static async createProject(requestData: CreateProjectRequest): Promise<ProjectData> {
        try {
            const titleExists = await this.checkProjectTitleExists(requestData.userId, requestData.projectTitle);
            if (titleExists) {
                throw new Error(`Project title "${requestData.projectTitle}" already exists. Please choose a different name.`);
            }

            const projectId = await this.generateUniqueProjectId(requestData.userId);
            const timestamp = new Date().toISOString();

            const document = {
                userId: requestData.userId,
                projectId: projectId,
                projectTitle: requestData.projectTitle,
                status: requestData.status || 'draft',
                type: 'project',
                createdAt: timestamp,
                updatedAt: timestamp,
                tocData: {
                    projectTitle: requestData.projectTitle,
                    bigPictureGoal: requestData.bigPictureGoal || null,
                    projectAim: requestData.projectAim || null,
                    objectives: requestData.objectives || null,
                    beneficiaries: requestData.beneficiaries || null,
                    activities: requestData.activities || null,
                    outcomes: requestData.outcomes || null,
                    externalFactors: requestData.externalFactors || null,
                    evidenceLinks: requestData.evidenceLinks || null
                },
                tocColor: requestData.tocColor || this.getDefaultTocColor(),
            };

            const { collection } = await this.getDatabase();
            await collection.insertOne(document);

            // Return data in flat ProjectData format
            return {
                projectId: document.projectId,
                status: document.status,
                type: document.type,
                createdAt: document.createdAt,
                updatedAt: document.updatedAt,
                tocData: document.tocData,
                tocColor: document.tocColor
            } as ProjectData;

        } catch (error) {
            console.error('Create project error:', error);
            throw error;
        }
    }

    static async updateProject(requestData: UpdateProjectRequest): Promise<ProjectData> {
        try {
            const existing = await this.getProjectById(requestData.userId, requestData.projectId);
            if (!existing) {
                throw new Error(`Project ${requestData.projectId} not found for user ${requestData.userId}`);
            }

            const isNameChange = existing.tocData.projectTitle.trim() !== requestData.projectTitle.trim();

            if (isNameChange) {
                if (!requestData.updateName) {
                    throw new Error('Project name change detected. Set updateName: true to confirm.');
                }

                const titleExists = await this.checkProjectTitleExists(
                    requestData.userId,
                    requestData.projectTitle,
                    requestData.projectId
                );
                if (titleExists) {
                    throw new Error(`Project title "${requestData.projectTitle}" already exists.`);
                }
            }

            const timestamp = new Date().toISOString();

            // Handle tocData updates properly
            const tocData = requestData.tocData;

            // Handle tocColor updates - deep merge to preserve nested structure
            let updatedTocColor = existing.tocColor || this.getDefaultTocColor();
            if (requestData.tocColor) {
                const defaultSection = { shape: "", text: "" };
                updatedTocColor = {
                    bigPictureGoal: {
                        ...defaultSection,
                        ...updatedTocColor.bigPictureGoal,
                        ...requestData.tocColor.bigPictureGoal
                    },
                    projectAim: {
                        ...defaultSection,
                        ...updatedTocColor.projectAim,
                        ...requestData.tocColor.projectAim
                    },
                    activities: {
                        ...defaultSection,
                        ...updatedTocColor.activities,
                        ...requestData.tocColor.activities
                    },
                    objectives: {
                        ...defaultSection,
                        ...updatedTocColor.objectives,
                        ...requestData.tocColor.objectives
                    },
                    beneficiaries: {
                        ...defaultSection,
                        ...updatedTocColor.beneficiaries,
                        ...requestData.tocColor.beneficiaries
                    },
                    outcomes: {
                        ...defaultSection,
                        ...updatedTocColor.outcomes,
                        ...requestData.tocColor.outcomes
                    },
                    externalFactors: {
                        ...defaultSection,
                        ...updatedTocColor.externalFactors,
                        ...requestData.tocColor.externalFactors
                    },
                    evidenceLinks: {
                        ...defaultSection,
                        ...updatedTocColor.evidenceLinks,
                        ...requestData.tocColor.evidenceLinks
                    }
                };
            }

            const updatedDocument = {
                userId: requestData.userId,
                projectId: requestData.projectId,
                projectTitle: requestData.projectTitle,
                status: requestData.status || existing.status,
                type: 'project',
                createdAt: existing.createdAt,
                updatedAt: timestamp,
                tocData: {
                    projectTitle: requestData.projectTitle,
                    bigPictureGoal: (tocData && tocData.hasOwnProperty('bigPictureGoal')) ? tocData.bigPictureGoal : existing.tocData.bigPictureGoal,
                    projectAim: (tocData && tocData.hasOwnProperty('projectAim')) ? tocData.projectAim : existing.tocData.projectAim,
                    objectives: (tocData && tocData.hasOwnProperty('objectives')) ? tocData.objectives : existing.tocData.objectives,
                    beneficiaries: (tocData && tocData.hasOwnProperty('beneficiaries')) ? tocData.beneficiaries : existing.tocData.beneficiaries,
                    activities: (tocData && tocData.hasOwnProperty('activities')) ? tocData.activities : existing.tocData.activities,
                    outcomes: (tocData && tocData.hasOwnProperty('outcomes')) ? tocData.outcomes : existing.tocData.outcomes,
                    externalFactors: (tocData && tocData.hasOwnProperty('externalFactors')) ? tocData.externalFactors : existing.tocData.externalFactors,
                    evidenceLinks: (tocData && tocData.hasOwnProperty('evidenceLinks')) ? tocData.evidenceLinks : existing.tocData.evidenceLinks
                },
                tocColor: updatedTocColor
            };

            const { collection } = await this.getDatabase();
            await collection.replaceOne(
                { userId: requestData.userId, projectId: requestData.projectId },
                updatedDocument
            );

            // Return data in flat ProjectData format
            return {
                projectId: updatedDocument.projectId,
                status: updatedDocument.status,
                type: updatedDocument.type,
                createdAt: updatedDocument.createdAt,
                updatedAt: updatedDocument.updatedAt,
                tocData: updatedDocument.tocData,
                tocColor: updatedDocument.tocColor
            } as ProjectData;

        } catch (error) {
            console.error('Update project error:', error);
            throw error;
        }
    }

    static async listUserProjects(userId: string): Promise<ProjectData[]> {
        try {
            const { collection } = await this.getDatabase();

            const docs = await collection
                .find({ userId: userId })
                .sort({ 'createdAt': -1 })
                .toArray();

            // Transform each document to match flat ProjectData structure
            return docs.map(doc => ({
                projectId: doc.projectId,
                status: doc.status,
                type: doc.type,
                createdAt: doc.createdAt,
                updatedAt: doc.updatedAt,
                tocData: {
                    projectTitle: doc.tocData?.projectTitle || doc.projectTitle,
                    bigPictureGoal: doc.tocData?.bigPictureGoal,
                    projectAim: doc.tocData?.projectAim,
                    objectives: doc.tocData?.objectives,
                    beneficiaries: doc.tocData?.beneficiaries,
                    activities: doc.tocData?.activities,
                    outcomes: doc.tocData?.outcomes,
                    externalFactors: doc.tocData?.externalFactors,
                    evidenceLinks: doc.tocData?.evidenceLinks
                },
                tocColor: doc.tocColor || this.getDefaultTocColor()
            } as ProjectData));

        } catch (error) {
            console.error('List projects error:', error);
            throw error;
        }
    }

    static async getProjects(requestData: GetProjectsRequest): Promise<ProjectData | ProjectData[]> {
        try {
            if (requestData.projectId) {
                const project = await this.getProjectById(requestData.userId, requestData.projectId);
                if (!project) {
                    throw new Error(`Project ${requestData.projectId} not found for user ${requestData.userId}`);
                }
                return project;
            } else {
                const projects = await this.listUserProjects(requestData.userId);
                return projects;
            }
        } catch (error) {
            console.error('Get projects error:', error);
            throw error;
        }
    }

    static async deleteProject(userId: string, projectId: string): Promise<boolean> {
        try {
            const { collection } = await this.getDatabase();

            const result = await collection.deleteOne({
                userId: userId,
                projectId: projectId
            });

            return result.deletedCount > 0;
        } catch (error) {
            console.error('Delete project error:', error);
            throw error;
        }
    }

    static async closeConnection(): Promise<void> {
        if (this.client) {
            await this.client.close();
            this.client = null;
            this.db = null;
        }
    }
}