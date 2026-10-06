import fs from 'fs';
import path from 'path';
import { getInitialDatabase, INITIAL_DEPARTMENTS, INITIAL_EMPLOYEES, INITIAL_EQUIPMENT, INITIAL_SETTINGS } from '../src/data/initialData';
import { DatabaseState } from '../src/types';

export { getInitialDatabase };
export type { DatabaseState };

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

export function loadDatabase(): DatabaseState {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(data) as DatabaseState;
      // ensure basic arrays exist
      if (!parsed.employees || parsed.employees.length === 0) {
        parsed.employees = INITIAL_EMPLOYEES;
      }
      if (!parsed.departments || parsed.departments.length === 0) {
        parsed.departments = INITIAL_DEPARTMENTS;
      }
      if (!parsed.equipment || parsed.equipment.length === 0) {
        parsed.equipment = INITIAL_EQUIPMENT;
      }
      if (!parsed.attendance) parsed.attendance = [];
      if (!parsed.penalties) parsed.penalties = [];
      if (!parsed.equipmentChecks) parsed.equipmentChecks = [];
      if (!parsed.dailyReports) parsed.dailyReports = [];
      if (!parsed.activityLogs) parsed.activityLogs = [];
      if (!parsed.settings) parsed.settings = INITIAL_SETTINGS;
      if (!parsed.users) parsed.users = [
        { id: 'u1', name: 'محمد', role: 'supervisor' },
        { id: 'u2', name: 'بلال', role: 'supervisor' },
        { id: 'u3', name: 'عبدالله', role: 'supervisor' },
      ];
      return parsed;
    }
  } catch (err) {
    console.error('Error loading database file, initializing fresh:', err);
  }

  const initial = getInitialDatabase();
  saveDatabase(initial);
  return initial;
}

export function saveDatabase(db: DatabaseState): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving database to file:', err);
  }
}
