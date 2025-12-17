#include "ThreadPool.hpp"
#include <iostream>
#include <sstream>

ThreadPool& ThreadPool::getInstance(size_t num_threads) {
    // Thread-safe singleton initialization (C++11 magic statics)
    static ThreadPool instance(num_threads);
    return instance;
}

ThreadPool::ThreadPool(size_t num_threads) {
    // Ensure at least 1 thread
    if (num_threads == 0) {
        num_threads = 1;
    }

    std::cerr << "[ThreadPool] Initializing with " << num_threads << " worker thread(s)" << std::endl;

    workers_.reserve(num_threads);

    for (size_t i = 0; i < num_threads; ++i) {
        workers_.emplace_back(&ThreadPool::workerLoop, this, i);
        std::cerr << "[ThreadPool] Worker thread " << i << " created (tid: "
                  << workers_.back().get_id() << ")" << std::endl;
    }

    std::cerr << "[ThreadPool] Ready to accept tasks" << std::endl;
}

ThreadPool::~ThreadPool() {
    std::cerr << "[ThreadPool] Shutting down..." << std::endl;

    {
        std::unique_lock<std::mutex> lock(queue_mutex_);
        stop_.store(true);
    }

    condition_.notify_all();

    for (size_t i = 0; i < workers_.size(); ++i) {
        if (workers_[i].joinable()) {
            workers_[i].join();
            std::cerr << "[ThreadPool] Worker thread " << i << " joined" << std::endl;
        }
    }

    std::cerr << "[ThreadPool] Shutdown complete" << std::endl;
}

void ThreadPool::workerLoop(size_t worker_id) {
    std::cerr << "[ThreadPool] Worker " << worker_id << " started, waiting for tasks..." << std::endl;

    while (true) {
        std::function<void()> task;
        size_t task_id;

        {
            std::unique_lock<std::mutex> lock(queue_mutex_);

            // Wait until there's a task or we're stopping
            condition_.wait(lock, [this] {
                return stop_.load() || !tasks_.empty();
            });

            // If stopping and no more tasks, exit
            if (stop_.load() && tasks_.empty()) {
                std::cerr << "[ThreadPool] Worker " << worker_id << " exiting (pool stopped)" << std::endl;
                return;
            }

            // Get the next task
            task = std::move(tasks_.front());
            tasks_.pop();
            task_id = total_tasks_processed_.fetch_add(1);
            active_tasks_.fetch_add(1);

            std::cerr << "[ThreadPool] Worker " << worker_id << " picked up task #" << task_id
                      << " (queue size: " << tasks_.size() << ", active: " << active_tasks_.load() << ")" << std::endl;
        }

        // Execute the task outside the lock
        auto start = std::chrono::high_resolution_clock::now();
        task();
        auto end = std::chrono::high_resolution_clock::now();
        auto duration_us = std::chrono::duration_cast<std::chrono::microseconds>(end - start).count();

        std::cerr << "[ThreadPool] Worker " << worker_id << " completed task #" << task_id
                  << " in " << duration_us << "us" << std::endl;

        // Decrement active count and notify waiters
        active_tasks_.fetch_sub(1);
        completion_condition_.notify_all();
    }
}

size_t ThreadPool::getPendingTaskCount() const {
    std::unique_lock<std::mutex> lock(queue_mutex_);
    return tasks_.size();
}

void ThreadPool::waitAll() {
    std::cerr << "[ThreadPool] Waiting for all tasks to complete..." << std::endl;
    std::unique_lock<std::mutex> lock(queue_mutex_);
    completion_condition_.wait(lock, [this] {
        return tasks_.empty() && active_tasks_.load() == 0;
    });
    std::cerr << "[ThreadPool] All tasks completed" << std::endl;
}

size_t ThreadPool::getTotalTasksProcessed() const {
    return total_tasks_processed_.load();
}
