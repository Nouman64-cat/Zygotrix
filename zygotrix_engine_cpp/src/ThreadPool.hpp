#ifndef THREAD_POOL_HPP
#define THREAD_POOL_HPP

#include <vector>
#include <queue>
#include <thread>
#include <mutex>
#include <condition_variable>
#include <functional>
#include <future>
#include <memory>
#include <stdexcept>
#include <atomic>
#include <chrono>

/**
 * @brief A lightweight thread pool optimized for single-core/low-resource servers.
 *
 * This thread pool provides concurrency (not parallelism) on single-core machines
 * by maintaining a fixed number of worker threads that process tasks from a queue.
 *
 * Benefits:
 * - Thread reuse: Workers are created once and reused for all tasks
 * - Task queuing: Requests are queued and processed in order
 * - Memory efficient: Fixed thread count prevents resource exhaustion
 * - Concurrency: Multiple tasks can progress through I/O waits
 *
 * For a 1-core, 2GB RAM server, recommended configuration:
 * - 1-2 worker threads for CPU-bound tasks
 * - Use the singleton instance for application-wide thread management
 */
class ThreadPool {
public:
    /**
     * @brief Get the singleton instance of the thread pool.
     * @param num_threads Number of worker threads (only used on first call).
     *                    Defaults to 1 for single-core optimization.
     * @return Reference to the global thread pool instance.
     */
    static ThreadPool& getInstance(size_t num_threads = 1);

    /**
     * @brief Construct a thread pool with a fixed number of workers.
     * @param num_threads Number of worker threads to create.
     *                    For single-core servers, use 1-2 threads.
     */
    explicit ThreadPool(size_t num_threads);

    /**
     * @brief Destructor - waits for all tasks to complete and joins threads.
     */
    ~ThreadPool();

    // Non-copyable and non-movable
    ThreadPool(const ThreadPool&) = delete;
    ThreadPool& operator=(const ThreadPool&) = delete;
    ThreadPool(ThreadPool&&) = delete;
    ThreadPool& operator=(ThreadPool&&) = delete;

    /**
     * @brief Submit a task to the thread pool.
     * @tparam F Callable type
     * @tparam Args Argument types
     * @param f The function to execute
     * @param args Arguments to pass to the function
     * @return A future that will contain the result
     *
     * Example:
     *   auto future = pool.submit(generateDNA, length, gc_content);
     *   std::string result = future.get();
     */
    template<typename F, typename... Args>
    auto submit(F&& f, Args&&... args)
        -> std::future<typename std::invoke_result<F, Args...>::type>;

    /**
     * @brief Get the number of worker threads.
     */
    size_t getThreadCount() const { return workers_.size(); }

    /**
     * @brief Get the number of pending tasks in the queue.
     */
    size_t getPendingTaskCount() const;

    /**
     * @brief Check if the pool is stopping.
     */
    bool isStopping() const { return stop_.load(); }

    /**
     * @brief Wait for all pending tasks to complete.
     * Note: Does not prevent new tasks from being submitted.
     */
    void waitAll();

private:
    /**
     * @brief Worker thread function - processes tasks from the queue.
     * @param worker_id The ID of this worker (for logging).
     */
    void workerLoop(size_t worker_id);

    std::vector<std::thread> workers_;
    std::queue<std::function<void()>> tasks_;

    mutable std::mutex queue_mutex_;
    std::condition_variable condition_;
    std::condition_variable completion_condition_;

    std::atomic<bool> stop_{false};
    std::atomic<size_t> active_tasks_{0};
    std::atomic<size_t> total_tasks_processed_{0};

public:
    /**
     * @brief Get the total number of tasks processed by this pool.
     */
    size_t getTotalTasksProcessed() const;
};

// Template implementation must be in header
template<typename F, typename... Args>
auto ThreadPool::submit(F&& f, Args&&... args)
    -> std::future<typename std::invoke_result<F, Args...>::type>
{
    using return_type = typename std::invoke_result<F, Args...>::type;

    auto task = std::make_shared<std::packaged_task<return_type()>>(
        std::bind(std::forward<F>(f), std::forward<Args>(args)...)
    );

    std::future<return_type> result = task->get_future();

    {
        std::unique_lock<std::mutex> lock(queue_mutex_);

        if (stop_.load()) {
            throw std::runtime_error("Cannot submit task to stopped ThreadPool");
        }

        tasks_.emplace([task]() { (*task)(); });
    }

    condition_.notify_one();
    return result;
}

#endif // THREAD_POOL_HPP
