"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { updateUserReleasingAccess } from "@/features/admin/user-actions";
import { notify } from "@/lib/notify";
import { ReleasingAccessEntry, TriageReleasingAccessUser } from "@/types/auth";
import { Department } from "@/types/models";
import { CheckCircle, MagnifyingGlass, UserCircle, XCircle } from "@phosphor-icons/react";
import { useMemo, useState } from "react";

type AccessMap = Record<string, ReleasingAccessEntry[]>;

function toMap(entries: ReleasingAccessEntry[]): Map<string, ReleasingAccessEntry> {
    return new Map(entries.map((entry) => [entry.departmentId, entry]));
}

function normalizeEntries(entries: ReleasingAccessEntry[]): ReleasingAccessEntry[] {
    const deduped = new Map<string, ReleasingAccessEntry>();
    for (const entry of entries) {
        const departmentId = entry.departmentId?.trim();
        if (!departmentId) continue;
        deduped.set(departmentId, {
            departmentId,
            enabled: entry.enabled !== false,
        });
    }
    return Array.from(deduped.values());
}

export function ManageReleasingPanel({
    users,
    departments,
}: {
    users: TriageReleasingAccessUser[];
    departments: Department[];
}) {
    const [userSearch, setUserSearch] = useState("");
    const [departmentSearch, setDepartmentSearch] = useState("");
    const [selectedUserId, setSelectedUserId] = useState(users[0]?.id ?? "");
    const [isSaving, setIsSaving] = useState(false);
    const [accessByUser, setAccessByUser] = useState<AccessMap>(() => {
        const initial: AccessMap = {};
        for (const user of users) {
            initial[user.id] = normalizeEntries(user.releasingAccess ?? []);
        }
        return initial;
    });

    const filteredUsers = useMemo(() => {
        const query = userSearch.trim().toLowerCase();
        if (!query) return users;

        return users.filter((user) =>
            user.name.toLowerCase().includes(query) ||
            user.email.toLowerCase().includes(query) ||
            user.employeeID.toLowerCase().includes(query)
        );
    }, [userSearch, users]);

    const selectedUser = useMemo(
        () => users.find((user) => user.id === selectedUserId) ?? filteredUsers[0] ?? null,
        [users, selectedUserId, filteredUsers]
    );

    const activeEntries = selectedUser ? accessByUser[selectedUser.id] ?? [] : [];
    const activeMap = toMap(activeEntries);

    const filteredDepartments = useMemo(() => {
        const query = departmentSearch.trim().toLowerCase();
        if (!query) return departments;
        return departments.filter((department) => department.name.toLowerCase().includes(query));
    }, [departmentSearch, departments]);

    const configuredCount = useMemo(
        () => Object.values(accessByUser).reduce((sum, entries) => sum + entries.length, 0),
        [accessByUser]
    );

    const enabledCount = useMemo(
        () => Object.values(accessByUser).reduce((sum, entries) => sum + entries.filter((entry) => entry.enabled).length, 0),
        [accessByUser]
    );

    const updateEntries = async (userId: string, nextEntries: ReleasingAccessEntry[]) => {
        const normalized = normalizeEntries(nextEntries);
        const previous = accessByUser[userId] ?? [];

        setAccessByUser((prev) => ({ ...prev, [userId]: normalized }));
        setIsSaving(true);

        try {
            const result = await updateUserReleasingAccess(userId, normalized);
            if (!result?.success) {
                setAccessByUser((prev) => ({ ...prev, [userId]: previous }));
                notify.error(result?.error || "Unable to save releasing access settings.");
                return;
            }
            notify.success("Releasing access updated.");
        } catch {
            setAccessByUser((prev) => ({ ...prev, [userId]: previous }));
            notify.error("Unable to save releasing access settings.");
        } finally {
            setIsSaving(false);
        }
    };

    const toggleDepartmentSelection = async (departmentId: string, checked: boolean) => {
        if (!selectedUser) return;

        const nextMap = toMap(activeEntries);
        if (checked) {
            nextMap.set(departmentId, { departmentId, enabled: true });
        } else {
            nextMap.delete(departmentId);
        }

        await updateEntries(selectedUser.id, Array.from(nextMap.values()));
    };

    const toggleDepartmentEnabled = async (departmentId: string, enabled: boolean) => {
        if (!selectedUser) return;

        const nextMap = toMap(activeEntries);
        const existing = nextMap.get(departmentId);
        if (!existing) return;

        nextMap.set(departmentId, { departmentId, enabled });
        await updateEntries(selectedUser.id, Array.from(nextMap.values()));
    };

    return (
        <main className="flex-1 p-6 lg:p-10 space-y-6 max-w-7xl mx-auto w-full">
            <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>Triage Users</CardDescription>
                        <CardTitle className="text-3xl">{users.length}</CardTitle>
                    </CardHeader>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>Department Links</CardDescription>
                        <CardTitle className="text-3xl">{configuredCount}</CardTitle>
                    </CardHeader>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>Enabled Links</CardDescription>
                        <CardTitle className="text-3xl">{enabledCount}</CardTitle>
                    </CardHeader>
                </Card>
            </section>

            <section className="grid grid-cols-1 xl:grid-cols-[360px_1fr] gap-6">
                <Card className="overflow-hidden">
                    <CardHeader className="border-b bg-muted/20 space-y-3">
                        <div>
                            <CardTitle className="text-base">Releasing Users</CardTitle>
                            <CardDescription>Select a triage nurse to manage release departments.</CardDescription>
                        </div>
                        <div className="relative">
                            <MagnifyingGlass size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                value={userSearch}
                                onChange={(event) => setUserSearch(event.target.value)}
                                placeholder="Search by name, email, employee ID"
                                className="pl-9"
                            />
                        </div>
                    </CardHeader>
                    <CardContent className="p-0 max-h-150 overflow-y-auto">
                        {filteredUsers.length === 0 ? (
                            <div className="p-6 text-sm text-muted-foreground text-center">No triage users found.</div>
                        ) : (
                            <div className="divide-y">
                                {filteredUsers.map((user) => {
                                    const entries = accessByUser[user.id] ?? [];
                                    const enabled = entries.filter((entry) => entry.enabled).length;
                                    const selected = selectedUser?.id === user.id;

                                    return (
                                        <button
                                            key={user.id}
                                            onClick={() => setSelectedUserId(user.id)}
                                            className={`w-full text-left px-4 py-3 transition-colors ${
                                                selected ? "bg-primary/5" : "hover:bg-muted/40"
                                            }`}
                                        >
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="min-w-0">
                                                    <p className="text-sm font-semibold text-foreground truncate">{user.name}</p>
                                                    <p className="text-xs text-muted-foreground truncate">{user.employeeID}</p>
                                                </div>
                                                <Badge variant={enabled > 0 ? "default" : "outline"}>{enabled}/{entries.length}</Badge>
                                            </div>
                                            <p className="text-xs text-muted-foreground truncate mt-1">{user.email}</p>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card className="overflow-hidden">
                    <CardHeader className="border-b bg-muted/20 space-y-3">
                        {!selectedUser ? (
                            <div>
                                <CardTitle className="text-base">Department Access</CardTitle>
                                <CardDescription>Select a triage user from the left panel.</CardDescription>
                            </div>
                        ) : (
                            <>
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <CardTitle className="text-base">Allow User To Release Ticket Number</CardTitle>
                                        <CardDescription>Manage clinic/department access for selected triage nurse.</CardDescription>
                                    </div>
                                    <Badge variant="secondary">{selectedUser.role.replace("_", " ")}</Badge>
                                </div>
                                <div className="rounded-md border bg-background px-3 py-2 flex items-center justify-between gap-3">
                                    <div className="min-w-0">
                                        <p className="text-sm font-semibold truncate">{selectedUser.name}</p>
                                        <p className="text-xs text-muted-foreground truncate">{selectedUser.employeeID} • {selectedUser.email}</p>
                                    </div>
                                    <UserCircle size={24} className="text-muted-foreground" />
                                </div>
                                <div className="relative">
                                    <MagnifyingGlass size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        value={departmentSearch}
                                        onChange={(event) => setDepartmentSearch(event.target.value)}
                                        placeholder="Search clinic/service"
                                        className="pl-9"
                                    />
                                </div>
                            </>
                        )}
                    </CardHeader>
                    <CardContent className="p-0">
                        {!selectedUser ? (
                            <div className="p-8 text-sm text-muted-foreground text-center">Choose a user to configure releasing departments.</div>
                        ) : (
                            <div className="max-h-150 overflow-y-auto divide-y">
                                {filteredDepartments.map((department) => {
                                    const entry = activeMap.get(department.id);
                                    const isSelected = !!entry;
                                    const isEnabled = entry?.enabled ?? false;

                                    return (
                                        <div key={department.id} className="px-4 py-3 flex items-center justify-between gap-4">
                                            <div className="min-w-0">
                                                <p className="text-sm font-medium truncate">{department.name}</p>
                                                <p className="text-xs text-muted-foreground">{department.code}</p>
                                            </div>

                                            <div className="flex items-center gap-3">
                                                <Button
                                                    type="button"
                                                    variant={isSelected ? "outline" : "secondary"}
                                                    size="sm"
                                                    onClick={() => toggleDepartmentSelection(department.id, !isSelected)}
                                                    disabled={isSaving}
                                                    className="min-w-20"
                                                >
                                                    {isSelected ? "Remove" : "Add"}
                                                </Button>

                                                <div className="flex items-center gap-2">
                                                    {isEnabled ? (
                                                        <CheckCircle size={16} className="text-emerald-600" />
                                                    ) : (
                                                        <XCircle size={16} className="text-muted-foreground" />
                                                    )}
                                                    <Switch
                                                        checked={isEnabled}
                                                        disabled={!isSelected || isSaving}
                                                        onCheckedChange={(checked) => toggleDepartmentEnabled(department.id, checked)}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}

                                {filteredDepartments.length === 0 && (
                                    <div className="p-8 text-sm text-muted-foreground text-center">No departments match your search.</div>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </section>
        </main>
    );
}
