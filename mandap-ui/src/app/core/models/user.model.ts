// User & Auth Models
export interface User {
    id: number;
    username: string;
    fullName: string;
    email?: string;
    active: boolean;
    roles: Role[];
    createdAt?: string;
}

export interface Role {
    id: number;
    name: string;
    description?: string;
    permissions: string[];
}

export interface Permission {
    id: number;
    name: string;
    description?: string;
}

export interface LoginRequest {
    username: string;
    password: string;
}

export interface LoginResponse {
    token: string;
    username: string;
    fullName: string;
    roles: string[];
    permissions: string[];
}

export interface UserRequest {
    username: string;
    password?: string;
    fullName: string;
    email?: string;
    isActive?: boolean;
    roleIds: number[];
}

export interface RoleRequest {
    name: string;
    description?: string;
    permissionIds: number[];
}
