package com.sparkstreaming.dsl.rules.test;

import com.sparkstreaming.dsl.rules.model.MetricEvent;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.OutputStream;
import java.net.ServerSocket;
import java.net.Socket;
import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicBoolean;

/**
 * Test data generator that pushes metrics to a socket port.
 * Simulates 3 machines in service_group A sending cpu_usage metrics.
 */
public class MetricDataGenerator {
    private static final Logger LOG = LoggerFactory.getLogger(MetricDataGenerator.class);
    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();
    
    private final int port;
    private final long intervalMs;
    private final AtomicBoolean running = new AtomicBoolean(false);
    private ServerSocket serverSocket;
    private final List<Socket> clientSockets = Collections.synchronizedList(new ArrayList<>());
    private ExecutorService executorService;
    
    public MetricDataGenerator(int port, long intervalMs) {
        this.port = port;
        this.intervalMs = intervalMs;
    }
    
    public void start() throws Exception {
        LOG.info("Starting MetricDataGenerator on port {}", port);
        serverSocket = new ServerSocket(port);
        running.set(true);
        
        executorService = Executors.newCachedThreadPool();
        
        // Accept client connections
        executorService.submit(() -> {
            while (running.get()) {
                try {
                    Socket clientSocket = serverSocket.accept();
                    LOG.info("Client connected: {}", clientSocket.getRemoteSocketAddress());
                    clientSockets.add(clientSocket);
                } catch (Exception e) {
                    if (running.get()) {
                        LOG.error("Error accepting client connection", e);
                    }
                }
            }
        });
        
        // Generate and send metrics
        executorService.submit(() -> {
            while (running.get()) {
                try {
                    generateAndSendMetrics();
                    Thread.sleep(intervalMs);
                } catch (Exception e) {
                    LOG.error("Error in metric generation loop", e);
                }
            }
        });
        
        LOG.info("MetricDataGenerator started successfully");
    }
    
    private void generateAndSendMetrics() throws Exception {
        List<MetricEvent> events = generateMetrics();
        String jsonBatch = OBJECT_MAPPER.writeValueAsString(events);
        
        // Send to all connected clients
        synchronized (clientSockets) {
            Iterator<Socket> iterator = clientSockets.iterator();
            while (iterator.hasNext()) {
                Socket socket = iterator.next();
                try {
                    if (socket.isClosed() || !socket.isConnected()) {
                        iterator.remove();
                        continue;
                    }
                    
                    OutputStream outputStream = socket.getOutputStream();
                    outputStream.write(jsonBatch.getBytes());
                    outputStream.write('\n');
                    outputStream.flush();
                } catch (Exception e) {
                    LOG.warn("Client connection error, removing client: {}", socket.getRemoteSocketAddress());
                    iterator.remove();
                    try {
                        socket.close();
                    } catch (Exception ex) {
                        // Ignore
                    }
                }
            }
        }
    }
    
    private List<MetricEvent> generateMetrics() {
        List<MetricEvent> events = new ArrayList<>();
        long timestamp = System.currentTimeMillis();
        
        // Generate metrics for 3 machines in service_group A
        String[] ips = {"192.168.1.1", "192.168.1.2", "192.168.1.3"};
        String[] hosts = {"host-01", "host-02", "host-03"};
        
        Random random = new Random();
        
        for (int i = 0; i < 3; i++) {
            // Generate realistic CPU usage between 20-80%
            double cpuUsage = 20 + random.nextDouble() * 60;
            
            Map<String, String> labels = new HashMap<>();
            labels.put("ip", ips[i]);
            labels.put("host", hosts[i]);
            labels.put("env", "prod");
            labels.put("datacenter", "us-east-1");
            
            MetricEvent event = new MetricEvent(
                timestamp,
                "cpu_usage",
                labels,
                cpuUsage
            );
            events.add(event);
            
            LOG.debug("Generated metric: {}", event);
        }
        
        return events;
    }
    
    public void stop() {
        LOG.info("Stopping MetricDataGenerator");
        running.set(false);
        
        // Close all client sockets
        synchronized (clientSockets) {
            for (Socket socket : clientSockets) {
                try {
                    socket.close();
                } catch (Exception e) {
                    // Ignore
                }
            }
            clientSockets.clear();
        }
        
        // Close server socket
        try {
            if (serverSocket != null && !serverSocket.isClosed()) {
                serverSocket.close();
            }
        } catch (Exception e) {
            LOG.error("Error closing server socket", e);
        }
        
        // Shutdown executor service
        if (executorService != null) {
            executorService.shutdown();
            try {
                executorService.awaitTermination(5, TimeUnit.SECONDS);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
        }
        
        LOG.info("MetricDataGenerator stopped");
    }
    
    public static void main(String[] args) throws Exception {
        int port = 9999;
        long intervalMs = 60000; // 1 minute
        
        MetricDataGenerator generator = new MetricDataGenerator(port, intervalMs);
        generator.start();
        
        // Run for 30 minutes or until interrupted
        CountDownLatch latch = new CountDownLatch(1);
        
        Runtime.getRuntime().addShutdownHook(new Thread(() -> {
            try {
                generator.stop();
                latch.countDown();
            } catch (Exception e) {
                e.printStackTrace();
            }
        }));
        
        System.out.println("MetricDataGenerator started on port " + port);
        System.out.println("Generating metrics every " + intervalMs + "ms for service_group A");
        System.out.println("Press Ctrl+C to stop");
        
        latch.await(30, TimeUnit.MINUTES);
        generator.stop();
    }
}