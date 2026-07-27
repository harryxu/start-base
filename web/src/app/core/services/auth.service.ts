import { Injectable, signal } from '@angular/core';

export interface User {
  id?: number;
  username: string;
  created_at?: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  currentUser = signal<User | null>(null);
}
