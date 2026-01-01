"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, MoreHorizontal } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useEffect, useState } from "react";
import { Subject } from "@/lib/definitions";

export default function SubjectsPage() {
    const [subjects, setSubjects] = useState<Subject[]>([]);

    useEffect(() => {
        try {
            const storedSubjects = localStorage.getItem('subjects');
            if (storedSubjects) {
                setSubjects(JSON.parse(storedSubjects));
            }
        } catch (error) {
            console.error("Could not access localStorage:", error);
        }
    }, []);

    return (
        <div className="container mx-auto p-4 md:p-8">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-3xl font-bold tracking-tight">Subjects</h1>
                <Button>
                    <PlusCircle className="mr-2 h-4 w-4" /> Add Subject
                </Button>
            </div>
            <Card>
                <CardContent className="mt-6">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[50px]">Color</TableHead>
                                <TableHead>Name</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Priority</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {subjects.map((subject) => (
                                <TableRow key={subject.id}>
                                    <TableCell>
                                        <div className="h-4 w-4 rounded-full" style={{ backgroundColor: subject.color }}></div>
                                    </TableCell>
                                    <TableCell className="font-medium">{subject.name}</TableCell>
                                    <TableCell>
                                        <Badge variant={subject.archived ? 'secondary' : 'default'}>
                                            {subject.archived ? 'Archived' : 'Active'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="capitalize">{subject.priority || '-'}</TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0">
                                                    <span className="sr-only">Open menu</span>
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                <DropdownMenuItem>Edit</DropdownMenuItem>
                                                <DropdownMenuItem>{subject.archived ? 'Unarchive' : 'Archive'}</DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
