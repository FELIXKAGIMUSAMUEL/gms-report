"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { BellIcon, PlusIcon, CalendarIcon, TrashIcon } from "@heroicons/react/24/outline";

interface Todo {
	id: string;
	userId: string;
	title: string;
	description?: string;
	dueDate: string;
	isCompleted: boolean;
	completedAt?: string;
	isDeferred: boolean;
	deferredUntil?: string;
	priority: "HIGH" | "MEDIUM" | "LOW";
	category: "MEETING" | "TRAINING" | "EVENT" | "DEADLINE" | "GENERAL" | "OTHER";
	reminderSent: boolean;
	createdAt: string;
	updatedAt: string;
}

interface TodoListProps {
	todos: Todo[];
	onTodoAdded?: () => void;
	onTodoToggled?: (id: string, isCompleted: boolean) => void;
	onTodoDeleted?: (id: string) => void;
}

const priorityColors = {
	HIGH: "text-red-600 bg-red-50 border-red-200",
	MEDIUM: "text-yellow-600 bg-yellow-50 border-yellow-200",
	LOW: "text-green-600 bg-green-50 border-green-200",
};

const categoryIcons = {
	MEETING: "📅",
	TRAINING: "🎓",
	EVENT: "🎉",
	DEADLINE: "⏰",
	GENERAL: "📝",
	OTHER: "📌",
};

export default function TodoListCard({ todos, onTodoAdded, onTodoToggled, onTodoDeleted }: TodoListProps) {
	const [newTodo, setNewTodo] = useState({ title: "", description: "", dueDate: "", priority: "MEDIUM", category: "GENERAL" });
	const [loading, setLoading] = useState(false);
	const [showForm, setShowForm] = useState(false);

	const activeTodos = todos.filter(t => !t.isCompleted && !t.isDeferred);
	const deferredTodos = todos.filter(t => t.isDeferred);
	const completedTodos = todos.filter(t => t.isCompleted);

	const handleAddTodo = async (e: FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		if (!newTodo.title || !newTodo.dueDate) return;

		setLoading(true);
		try {
			const response = await fetch("/api/todos", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(newTodo),
			});

			if (!response.ok) {
				const err = await response.json().catch(() => ({}));
				throw new Error(err.error || "Failed to add to-do");
			}

			setNewTodo({ title: "", description: "", dueDate: "", priority: "MEDIUM", category: "GENERAL" });
			setShowForm(false);
			onTodoAdded?.();
		} catch (error) {
			console.error("Failed to add todo:", error);
		} finally {
			setLoading(false);
		}
	};

	const handleToggleTodo = async (id: string, isCompleted: boolean) => {
		try {
			const response = await fetch("/api/todos", {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ id, isCompleted }),
			});

			if (response.ok) {
				onTodoToggled?.(id, isCompleted);
			}
		} catch (error) {
			console.error("Failed to toggle todo:", error);
		}
	};

	const handleDeleteTodo = async (id: string) => {
		try {
			const response = await fetch(`/api/todos?id=${id}`, {
				method: "DELETE",
			});

			if (response.ok) {
				onTodoDeleted?.(id);
			}
		} catch (error) {
			console.error("Failed to delete todo:", error);
		}
	};

	const daysUntil = (dateStr: string) => {
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		const target = new Date(dateStr);
		target.setHours(0, 0, 0, 0);
		return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
	};

	const formatDate = (dateStr: string) => {
		const date = new Date(dateStr);
		return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
	};

	return (
		<div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
			<div className="flex items-center justify-between mb-4">
				<div className="flex items-center gap-2">
					<BellIcon className="w-5 h-5 text-blue-600" />
					<h3 className="text-lg font-semibold text-gray-900">To do List</h3>
				</div>
				<button
					onClick={() => setShowForm(!showForm)}
					className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors"
				>
					<PlusIcon className="w-4 h-4" />
					{showForm ? "Close" : "Add To-Do"}
				</button>
			</div>

			{showForm && (
				<form onSubmit={handleAddTodo} className="space-y-4 mb-6">
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
						<input
							type="text"
							placeholder="Program name"
							value={newTodo.title}
							onChange={(e) => setNewTodo(prev => ({ ...prev, title: e.target.value }))}
							className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-900 focus:ring-2 focus:ring-blue-500"
							required
						/>
						<input
							type="datetime-local"
							value={newTodo.dueDate}
							onChange={(e) => setNewTodo(prev => ({ ...prev, dueDate: e.target.value }))}
							className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-900 focus:ring-2 focus:ring-blue-500"
							required
						/>
					</div>
					<div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-1">
						<textarea
							placeholder="Description (optional)"
							value={newTodo.description}
							onChange={(e) => setNewTodo(prev => ({ ...prev, description: e.target.value }))}
							className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-900 focus:ring-2 focus:ring-blue-500"
							rows={2}
						/>
						<select
							value={newTodo.priority}
							onChange={(e) => setNewTodo(prev => ({ ...prev, priority: e.target.value }))}
							className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-900 focus:ring-2 focus:ring-blue-500"
						>
							<option value="LOW">Low Priority</option>
							<option value="MEDIUM">Medium Priority</option>
							<option value="HIGH">High Priority</option>
						</select>
						<select
							value={newTodo.category}
							onChange={(e) => setNewTodo(prev => ({ ...prev, category: e.target.value }))}
							className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-900 focus:ring-2 focus:ring-blue-500"
						>
							<option value="MEETING">Meeting</option>
							<option value="TRAINING">Training</option>
							<option value="EVENT">Event</option>
							<option value="DEADLINE">Deadline</option>
							<option value="GENERAL">General</option>
							<option value="OTHER">Other</option>
						</select>
					</div>
					<div className="flex gap-2">
						<button
							type="submit"
							disabled={loading}
							className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 text-sm font-medium transition-colors"
						>
							{loading ? "Adding..." : "Save To-Do"}
						</button>
						<button
							type="button"
							onClick={() => setShowForm(false)}
							className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm font-medium transition-colors"
						>
							Cancel
						</button>
					</div>
				</form>
			)}

			{/* Active Todos */}
			<div className="mb-6">
				<h4 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wide">To do List ({activeTodos.length})</h4>
				<div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
					{activeTodos.length === 0 ? (
						<p className="text-gray-500 text-sm text-center py-4">No active programs</p>
					) : (
						activeTodos.map(todo => {
							const days = daysUntil(todo.dueDate);
							const isUrgent = days <= 1;
							return (
								<div
									key={todo.id}
									className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
										isUrgent ? "bg-red-50 border-red-200" : "bg-gray-50 border-gray-200 hover:bg-gray-100"
									}`}
								>
									<button
										onClick={() => handleToggleTodo(todo.id, true)}
										className="mt-1 flex-shrink-0 w-5 h-5 rounded border-2 border-gray-300 hover:border-blue-500 hover:bg-blue-50 transition-colors"
									/>
									<div className="flex-1 min-w-0">
										<div className="flex items-center gap-2 mb-1">
											<span className="text-lg">{categoryIcons[todo.category]}</span>
											<p className="font-semibold text-gray-900 truncate">{todo.title}</p>
											<span className={`inline-block px-2 py-0.5 rounded text-xs font-bold border ${priorityColors[todo.priority]}`}>
												{todo.priority}
											</span>
										</div>
										{todo.description && <p className="text-xs text-gray-600 mb-1">{todo.description}</p>}
										<div className="flex items-center gap-2 text-xs text-gray-600">
											<CalendarIcon className="w-3 h-3" />
											<span>{formatDate(todo.dueDate)}</span>
											{days >= 0 && <span className={isUrgent ? "text-red-600 font-bold" : ""}>{days} days left</span>}
											{days < 0 && <span className="text-red-600 font-bold">Overdue by {Math.abs(days)} days</span>}
										</div>
									</div>
									<button
										onClick={() => handleDeleteTodo(todo.id)}
										className="flex-shrink-0 p-1 text-gray-400 hover:text-red-600 transition-colors"
									>
										<TrashIcon className="w-4 h-4" />
									</button>
								</div>
							);
						})
					)}
				</div>
			</div>

			{/* Deferred Todos */}
			{deferredTodos.length > 0 && (
				<div className="mb-6">
					<h4 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wide text-gray-500">Deferred ({deferredTodos.length})</h4>
					<div className="space-y-2 max-h-[150px] overflow-y-auto pr-2">
						{deferredTodos.map(todo => (
							<div key={todo.id} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 border border-gray-200 opacity-60">
								<p className="text-sm text-gray-600">{todo.title} - Deferred until {formatDate(todo.deferredUntil || todo.dueDate)}</p>
							</div>
						))}
					</div>
				</div>
			)}

			{/* Completed Todos */}
			{completedTodos.length > 0 && (
				<div>
					<h4 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wide text-green-600">Completed ({completedTodos.length})</h4>
					<div className="space-y-1 max-h-[150px] overflow-y-auto pr-2">
						{completedTodos.slice(0, 5).map(todo => (
							<p key={todo.id} className="text-sm text-gray-500 line-through">✓ {todo.title}</p>
						))}
						{completedTodos.length > 5 && <p className="text-xs text-gray-400 text-center">+{completedTodos.length - 5} more completed</p>}
					</div>
				</div>
			)}
		</div>
	);
}
