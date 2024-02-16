// Define job class
class Job {
  constructor(id, arrivalTime, burstTime) {
    this.id = id;
    this.arrivalTime = arrivalTime;
    this.burstTime = burstTime;
    this.startTime = null;
    this.endTime = null;
  }
}

// Define core class
class Core {
  constructor() {
    this.jobs = [];
    this.currentTime = 0;
  }

  // Add job to core if it fits in the schedule
  addJob(job) {
    job.startTime = Math.max(this.currentTime, job.arrivalTime);
    job.endTime = job.startTime + job.burstTime;
    this.currentTime = job.endTime;
    this.jobs.push(job);
  }
}

// Initialize jobs array, cores array, and selected algorithm
let jobs = [];
let cores = [];
let selectedAlgorithm = ''; // No default algorithm
let numberOfCores = 1; // Default to 1 core
let queueStates = []; // Record of queue states at different times

// Function to initialize cores
function initializeCores(numCores) {
  cores = [];
  for (let i = 0; i < numCores; i++) {
    cores.push(new Core());
  }
}

// Function to add a job to the jobs array
function addJob(id, arrivalTime, burstTime) {
  const job = new Job(id, arrivalTime, burstTime);
  jobs.push(job);
  if (selectedAlgorithm) {
    scheduleJobsMultiCore();
  }
  updateUI();
}

// Function to remove a job from the jobs array
function removeJob(jobId) {
  jobs = jobs.filter(job => job.id !== jobId);
  if (selectedAlgorithm) {
    scheduleJobsMultiCore();
  }
  updateUI();
}

// Function to schedule jobs across multiple cores
function scheduleJobsMultiCore() {
  initializeCores(numberOfCores); // Reset and initialize cores
  queueStates = []; // Reset queue states before each scheduling

  let jobsToSchedule = JSON.parse(JSON.stringify(jobs)).sort((a, b) => a.arrivalTime - b.arrivalTime);
  cores.forEach(core => {
    core.jobs = [];
    core.currentTime = 0;
  });

  // Helper function to add or update queue states
  function updateQueueStates(time, jobs) {
    // Check if there's already a queue state for this time
    let state = queueStates.find(s => s.time === time);
    if (state) {
      // Merge jobs with the existing queue
      state.queue = [...new Set([...state.queue, ...jobs])];
    } else {
      // Create a new queue state
      queueStates.push({ time: time, queue: [...jobs] });
    }
  }

  if (selectedAlgorithm === 'fcfs') {
    jobsToSchedule.forEach(job => {
      let coreWithEarliestTime = cores.reduce((earliest, current) => earliest.currentTime <= current.currentTime ? earliest : current);
      job.startTime = Math.max(coreWithEarliestTime.currentTime, job.arrivalTime);
      job.endTime = job.startTime + job.burstTime;
      coreWithEarliestTime.currentTime = job.endTime;
      coreWithEarliestTime.jobs.push(job);

      // Capture the current state of the queue
      let currentQueue = jobsToSchedule.filter(j => j.arrivalTime <= coreWithEarliestTime.currentTime && !coreWithEarliestTime.jobs.includes(j)).map(j => j.id);
      updateQueueStates(job.startTime, currentQueue);
    });
  } else if (selectedAlgorithm === 'sjf') {
    while (jobsToSchedule.length > 0) {
      let coreWithEarliestTime = cores.reduce((earliest, current) => earliest.currentTime <= current.currentTime ? earliest : current);
      let availableJobs = jobsToSchedule.filter(j => j.arrivalTime <= coreWithEarliestTime.currentTime);

      if (availableJobs.length > 0) {
        let job = availableJobs.sort((a, b) => a.burstTime - b.burstTime)[0]; // Select job with the shortest burst time
        jobsToSchedule = jobsToSchedule.filter(j => j.id !== job.id); // Remove the chosen job from the pool

        job.startTime = Math.max(coreWithEarliestTime.currentTime, job.arrivalTime);
        job.endTime = job.startTime + job.burstTime;
        coreWithEarliestTime.currentTime = job.endTime;
        coreWithEarliestTime.jobs.push(job);

        // Update queue state
        let currentQueue = jobsToSchedule.filter(j => j.arrivalTime <= coreWithEarliestTime.currentTime).map(j => j.id);
        updateQueueStates(job.startTime, currentQueue);
      } else {
        // No jobs available yet, advance time to next job's arrival
        let nextJobArrivalTime = Math.min(...jobsToSchedule.map(j => j.arrivalTime));
        coreWithEarliestTime.currentTime = nextJobArrivalTime;
      }
    }
  }

  // Reflect the scheduled jobs in the global array
  jobs = cores.flatMap(core => core.jobs);

  // Sort queueStates by time to ensure chronological order
  // queueStates.sort((a, b) => a.time - b.time);

  // Update the UI and queue state table after scheduling
  updateUI();
  updateQueueStateTable();
}

// Function to create a detailed timeline graphic
function createTimelineGraphic() {
  const timelineContainer = document.getElementById('timeline-container');
  timelineContainer.innerHTML = ''; // Clear existing timeline

  // Find the highest end time among all jobs
  let maxEndTime = 0;
  cores.forEach(core => {
    core.jobs.forEach(job => {
      if (job.endTime > maxEndTime) {
        maxEndTime = job.endTime;
      }
    });
  });

  // Create timeline header and add time labels
  const timelineHeader = document.createElement('div');
  timelineHeader.classList.add('timeline-header');
  for (let time = 0; time <= maxEndTime; time += 2) {
    const timeLabel = document.createElement('div');
    timeLabel.classList.add('time-slot');
    timeLabel.textContent = time;
    // Set the left position to align with the timeline scale (10px per time unit)
    timeLabel.style.left = `${time * 10}px`;
    timelineHeader.appendChild(timeLabel);
  }
  timelineContainer.appendChild(timelineHeader);

  cores.forEach((core, coreIndex) => {
    const coreDiv = document.createElement('div');
    coreDiv.classList.add('core-timeline');

    // Create and append the core label to the coreDiv
    const coreLabel = document.createElement('div');
    coreLabel.textContent = `CPU-${coreIndex + 1}`;
    coreLabel.classList.add('core-label');
    coreDiv.appendChild(coreLabel);

    // Create a container for the job blocks to ensure they are positioned next to the core label
    const jobContainer = document.createElement('div');
    jobContainer.classList.add('job-container');

    core.jobs.forEach(job => {
      const jobDiv = document.createElement('div');
      jobDiv.classList.add('job-block');
      jobDiv.textContent = job.id;
      jobDiv.style.left = `${job.startTime * 10}px`; // Example: 10px per time unit
      jobDiv.style.width = `${job.burstTime * 10}px`;
      jobDiv.style.backgroundColor = getRandomColor();
      jobContainer.appendChild(jobDiv);
      
      // Create and append start time label
      const startTimeLabel = document.createElement('span');
      startTimeLabel.classList.add('time-label', 'start-time');
      startTimeLabel.textContent = job.startTime;
      startTimeLabel.style.left = `${job.startTime * 10}px`;
      jobContainer.appendChild(startTimeLabel);

      // Create and append end time label
      const endTimeLabel = document.createElement('span');
      endTimeLabel.classList.add('time-label', 'end-time');
      endTimeLabel.textContent = job.endTime;
      endTimeLabel.style.left = `${job.endTime * 10}px`;
      jobContainer.appendChild(endTimeLabel);
    });

    coreDiv.appendChild(jobContainer);
    timelineContainer.appendChild(coreDiv);
  });
}

// Helper function to get a random color
function getRandomColor() {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}

// Record of queue states at different times
function captureQueueState(currentTime, jobsToSchedule) {
  let queueSnapshot = jobsToSchedule.map(job => ({ id: job.id, arrivalTime: job.arrivalTime, burstTime: job.burstTime }));
  queueStates.push({ time: currentTime, queue: queueSnapshot });
}

// Update the queue state table
function updateQueueStateTable() {
  const container = document.getElementById('queue-state-container');
  container.innerHTML = ''; // Clear existing content

  const table = document.createElement('table');
  table.className = 'queue-state-table'; // Assign a class for styling
  const thead = document.createElement('thead');
  const tbody = document.createElement('tbody');
  table.appendChild(thead);
  table.appendChild(tbody);

  // Creating table headers
  const headerRow = document.createElement('tr');
  const timeHeader = document.createElement('th');
  timeHeader.textContent = 'Time';
  const queueHeader = document.createElement('th');
  queueHeader.textContent = 'Jobs in Queue';
  headerRow.appendChild(timeHeader);
  headerRow.appendChild(queueHeader);
  thead.appendChild(headerRow);

  // Aggregate queue states by time to avoid duplicates
  let aggregatedQueueStates = aggregateQueueStates(queueStates);

  // Filling the table body with aggregated queue states
  aggregatedQueueStates.forEach(({ time, queue }) => {
    const row = document.createElement('tr');
    const timeCell = document.createElement('td');
    const queueCell = document.createElement('td');
    timeCell.textContent = time;
    queueCell.textContent = queue.join(', ');
    row.appendChild(timeCell);
    row.appendChild(queueCell);
    tbody.appendChild(row);
  });

  container.appendChild(table);
}

// Helper function to aggregate queue states by time
function aggregateQueueStates(queueStates) {
  let aggregated = [];
  queueStates.forEach(state => {
    let existingState = aggregated.find(s => s.time === state.time);
    if (existingState) {
      existingState.queue = [...new Set([...existingState.queue, ...state.queue])];
    } else {
      aggregated.push({ ...state, queue: [...state.queue] });
    }
  });
  return aggregated;
}

// Function to update the UI with the scheduled jobs
function updateUI() {
  const tableBody = document.getElementById('jobs-table-body');
  tableBody.innerHTML = ''; // Clear existing table rows
  let totalTurnAroundTime = 0;
  jobs.forEach(job => {
    const row = tableBody.insertRow();
    row.insertCell(0).textContent = job.id;
    row.insertCell(1).textContent = job.arrivalTime;
    row.insertCell(2).textContent = job.burstTime;
    row.insertCell(3).textContent = job.startTime;
    row.insertCell(4).textContent = job.endTime;
    const turnAroundTime = job.endTime - job.arrivalTime;
    row.insertCell(5).textContent = turnAroundTime; // Turn-around time
    totalTurnAroundTime += turnAroundTime;

    // Add a "Remove" button to each row
    const removeButton = document.createElement('button');
    removeButton.textContent = 'Remove';
    removeButton.className = 'remove-job';
    removeButton.dataset.jobId = job.id;
    removeButton.onclick = function() {
      removeJob(job.id);
    };
    const removeCell = row.insertCell(6);
    removeCell.appendChild(removeButton);
  });

  // Calculate and display the average turnaround time
  const avgTurnAroundTime = totalTurnAroundTime / jobs.length;
  const avgTurnAroundTimeRow = tableBody.insertRow();
  avgTurnAroundTimeRow.insertCell(0).textContent = 'Average Turn-Around Time';
  avgTurnAroundTimeRow.insertCell(1).colSpan = 5;
  avgTurnAroundTimeRow.insertCell(1).textContent = avgTurnAroundTime.toFixed(2);

  createTimelineGraphic(); // Call function to create the timeline graphic
}

// Function to load a test scenario
function loadTestScenario() {
  // Define a test scenario with predefined jobs
  const testJobs = [
    { id: 'J1', arrivalTime: 0, burstTime: 30 },
    { id: 'J2', arrivalTime: 0, burstTime: 10 },
    { id: 'J3', arrivalTime: 0, burstTime: 20 },
    { id: 'J4', arrivalTime: 8, burstTime: 15 },
    { id: 'J5', arrivalTime: 16, burstTime: 7 },
    { id: 'J6', arrivalTime: 18, burstTime: 4 }
  ];

  // Clear existing jobs
  jobs = [];

  // Add predefined jobs to the jobs array
  testJobs.forEach(job => {
    addJob(job.id, job.arrivalTime, job.burstTime);
  });

  // Update the UI with the new jobs
  updateUI();
  console.log("Test scenario loaded");
}
// Setup event listener for the Load Test Scenario button
document.getElementById('load-test-scenario').addEventListener('click', loadTestScenario);

// Setup event listeners
function setupEventListeners() {
  // Event listener for the add job button
  document.getElementById('add-job').addEventListener('click', function() {
      const id = document.getElementById('job-number').value;
      const arrivalTime = parseInt(document.getElementById('arrival-time').value, 10);
      const burstTime = parseInt(document.getElementById('burst-time').value, 10);
      addJob(id, arrivalTime, burstTime);
  });

  // Event listener for algorithm selection change
  document.getElementById('algorithm-select').addEventListener('change', function(event) {
    selectedAlgorithm = event.target.value;
    scheduleJobsMultiCore(); // Reschedule jobs based on the new algorithm
    updateUI(); // Reflect changes in the UI
  });

  // Event listener for CPU cores input change
  document.getElementById('cpu-cores').addEventListener('change', function(event) {
      numberOfCores = parseInt(event.target.value, 10);
      if (selectedAlgorithm) {
          scheduleJobsMultiCore();
      }
      updateUI();
  });

  // Event listener for the Load Test Scenario button
  document.getElementById('load-test-scenario').addEventListener('click', loadTestScenario);
}

// Check if the DOM is fully loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', setupEventListeners);
} else {
  setupEventListeners();
}
