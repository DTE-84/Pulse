# Access Control Policy

**Effective Date:** July 2026
**Version:** 1.0
**Applies To:** All Pulse-Ai employees, contractors, and third-party vendors with access to organizational resources.

## 1. Purpose

The purpose of this Access Control Policy is to establish a defined and documented framework for managing access to Pulse-Ai's organizational resources. This policy ensures that access is granted securely, consistently, and in compliance with industry standards to protect sensitive financial telemetry, user data, and internal infrastructure from unauthorized access, modification, or disclosure.

## 2. Scope

This policy applies to all systems, networks, applications, and physical facilities owned, managed, or leased by Pulse-Ai. It covers all individuals who interact with these resources.

## 3. Core Principles

Access to Pulse-Ai resources is governed by the following core principles:

1. **Principle of Least Privilege (PoLP):** Users are granted only the minimum level of access necessary to perform their authorized job responsibilities.
2. **Role-Based Access Control (RBAC):** Access rights are grouped into roles (e.g., `user`, `auditor`, `admin`). Users are assigned roles rather than individual permissions.
3. **Need-to-Know:** Access to sensitive information is granted only if the information is required for the user to execute their duties.
4. **Default Deny:** If an access rule is not explicitly defined to allow access, the system must default to denying access.

## 4. Role-Based Access Controls (RBAC)

The organization defines specific roles with pre-approved access rights. Currently, Pulse-Ai enforces the following technical roles within its internal Identity and Access Management (IAM) Portal:

- **User:** Standard employee access. Limited to personal resources and non-sensitive internal tools. No access to customer financial data or system configurations.
- **Auditor:** Read-only access to system logs, the IAM portal directory, and audit trails. Cannot modify data or system states. Designed for compliance and security review teams.
- **Administrator (`admin`):** Full read/write access to the IAM portal, user directories, and system configurations. Restricted strictly to the Core Engineering and Security Leadership teams.

## 5. Procedures for Access Management

### 5.1. Granting Access (Provisioning)
1. **Approval:** All requests for access (or role elevation) must be formally submitted and approved by the resource owner and the user's direct manager.
2. **Implementation:** Upon approval, access is provisioned via the Centralized IAM Portal or the automated HR Webhook system.
3. **Authentication:** All users must authenticate using multi-factor authentication (MFA) to access internal systems.

### 5.2. Modifying Access (Transfers & Promotions)
1. When an employee changes roles or departments, their access rights must be immediately reviewed.
2. The HR Webhook integration (`employee.transferred` event) automatically triggers an access review and adjusts the user's `system_role` to align with their new responsibilities, revoking any access no longer required.

### 5.3. Revoking Access (De-Provisioning)
1. Access must be revoked immediately upon an employee's termination or resignation.
2. The HR Webhook integration (`employee.terminated` event) automatically:
   - Revokes the user's authentication identity (Supabase).
   - Wipes any associated active access tokens (Plaid secrets).
   - Updates their status to `terminated` in the organizational directory.
3. Physical access (keycards) and hardware (laptops) must be returned to IT on the final day of employment.

## 6. Access Monitoring and Audit

1. **Audit Logs:** All access activities (including logins, role modifications, and data exports) are automatically recorded in the centralized `audit_logs` database.
2. **Monitoring:** The `audit_logs` are accessible in real-time via the IAM Admin Portal (`/admin/iam`) for continuous monitoring by the `auditor` and `admin` roles.
3. **Periodic Reviews:** Access rights and role assignments must be reviewed by management on a quarterly basis to ensure compliance with the Principle of Least Privilege.

## 7. Policy Review

This Access Control Policy will be reviewed and updated at least annually, or following any significant change to Pulse-Ai's security architecture or regulatory requirements, to ensure ongoing compliance with industry standards.
