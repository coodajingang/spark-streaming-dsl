package com.sparkstreaming.dsl.rules.utils;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.nio.file.*;
import java.time.Duration;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.function.Consumer;

public class FileWatchService {
    private static final Logger LOG = LoggerFactory.getLogger(FileWatchService.class);
    
    private final Path filePath;
    private final List<Consumer<Path>> listeners = new CopyOnWriteArrayList<>();
    private final ExecutorService executor = Executors.newSingleThreadExecutor();
    private final Duration checkInterval;
    
    private volatile boolean running = false;
    private WatchService watchService;
    
    public FileWatchService(String filePath, Duration checkInterval) {
        this.filePath = Paths.get(filePath).toAbsolutePath();
        this.checkInterval = checkInterval;
    }
    
    public void addListener(Consumer<Path> listener) {
        listeners.add(listener);
    }
    
    public void start() throws IOException {
        if (running) {
            LOG.warn("File watch service is already running");
            return;
        }
        
        LOG.info("Starting file watch service for: {}", filePath);
        
        // Create watch service
        watchService = FileSystems.getDefault().newWatchService();
        
        // Register watch service
        Path directory = filePath.getParent();
        if (directory != null) {
            directory.register(
                watchService,
                StandardWatchEventKinds.ENTRY_MODIFY,
                StandardWatchEventKinds.ENTRY_CREATE
            );
        }
        
        running = true;
        
        // Start watching thread
        executor.submit(() -> {
            try {
                watchLoop();
            } catch (Exception e) {
                LOG.error("Error in file watch loop", e);
            }
        });
    }
    
    private void watchLoop() throws IOException, InterruptedException {
        while (running) {
            WatchKey key = watchService.poll(checkInterval.toMillis(), java.util.concurrent.TimeUnit.MILLISECONDS);
            
            if (key != null) {
                for (WatchEvent<?> event : key.pollEvents()) {
                    WatchEvent.Kind<?> kind = event.kind();
                    
                    if (kind == StandardWatchEventKinds.OVERFLOW) {
                        continue;
                    }
                    
                    @SuppressWarnings("unchecked")
                    WatchEvent<Path> ev = (WatchEvent<Path>) event;
                    Path changedFile = ev.context();
                    
                    if (changedFile.getFileName().equals(filePath.getFileName())) {
                        LOG.info("File changed: {}", filePath);
                        notifyListeners();
                    }
                }
                
                if (!key.reset()) {
                    LOG.warn("Watch key is no longer valid");
                    break;
                }
            }
        }
    }
    
    private void notifyListeners() {
        for (Consumer<Path> listener : listeners) {
            try {
                listener.accept(filePath);
            } catch (Exception e) {
                LOG.error("Error notifying listener", e);
            }
        }
    }
    
    public void stop() {
        if (!running) {
            return;
        }
        
        LOG.info("Stopping file watch service");
        running = false;
        
        if (watchService != null) {
            try {
                watchService.close();
            } catch (IOException e) {
                LOG.error("Error closing watch service", e);
            }
        }
        
        executor.shutdown();
    }
}