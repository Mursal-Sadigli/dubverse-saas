import { Project } from "./types";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";

const STORE_PATH = join(process.cwd(), "tmp", "db", "projects.json");

function ensureStore() {
  const dir = join(process.cwd(), "tmp", "db");
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  if (!existsSync(STORE_PATH)) writeFileSync(STORE_PATH, JSON.stringify({ projects: {} }));
}

function readStore(): Record<string, Project> {
  ensureStore();
  try {
    const data = readFileSync(STORE_PATH, "utf-8");
    return JSON.parse(data).projects || {};
  } catch {
    return {};
  }
}

function writeStore(projects: Record<string, Project>) {
  ensureStore();
  writeFileSync(STORE_PATH, JSON.stringify({ projects }, null, 2));
}

export function getProject(id: string): Project | undefined {
  const projects = readStore();
  return projects[id];
}

export function getAllProjects(userId: string): Project[] {
  const projects = readStore();
  return Object.values(projects)
    .filter((p) => p.userId === userId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function setProject(project: Project): void {
  const projects = readStore();
  projects[project.id] = project;
  writeStore(projects);
}

export function updateProject(id: string, updates: Partial<Project>): Project | null {
  const projects = readStore();
  const existing = projects[id];
  if (!existing) return null;
  const updated = { ...existing, ...updates, updatedAt: new Date().toISOString() };
  projects[id] = updated;
  writeStore(projects);
  return updated;
}

export function deleteProject(id: string): boolean {
  const projects = readStore();
  if (!projects[id]) return false;
  delete projects[id];
  writeStore(projects);
  return true;
}
