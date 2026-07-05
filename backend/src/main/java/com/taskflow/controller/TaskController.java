package com.taskflow.controller;

import com.taskflow.entity.Task;
import com.taskflow.service.TaskService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tasks")
@CrossOrigin(origins = "http://localhost:5173")
public class TaskController {

    private final TaskService taskService;

    public TaskController(TaskService taskService) {
        this.taskService = taskService;
    }

    @GetMapping
    public List<Task> getAllTasks(Authentication authentication) {
        return taskService.getAllTasks(authentication.getName());
    }

    @GetMapping("/{id}")
    public Task getTaskById(
            @PathVariable Long id,
            Authentication authentication
    ) {
        return taskService.getTaskById(
                id,
                authentication.getName()
        );
    }

    @PostMapping
    public Task createTask(
            @RequestBody Task task,
            Authentication authentication
    ) {
        return taskService.createTask(
                task,
                authentication.getName()
        );
    }

    @PutMapping("/{id}")
    public Task updateTask(
            @PathVariable Long id,
            @RequestBody Task task,
            Authentication authentication
    ) {
        return taskService.updateTask(
                id,
                task,
                authentication.getName()
        );
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteTask(
            @PathVariable Long id,
            Authentication authentication
    ) {
        taskService.deleteTask(
                id,
                authentication.getName()
        );

        return ResponseEntity.ok("Task deleted successfully");
    }
}