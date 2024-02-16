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
  // Reset and initialize cores
  initializeCores(numberOfCores);
  
  // Sort jobs by arrival time initially for all algorithms
  let jobsToSchedule = JSON.parse(JSON.stringify(jobs)).sort((a, b) => a.arrivalTime - b.arrivalTime);

  // Clear previous jobs from cores
  cores.forEach(core => {
    core.jobs = [];
    core.currentTime = 0;
  });

  // Handle FCFS scheduling
  if (selectedAlgorithm === 'fcfs') {
    jobsToSchedule.forEach(job => {
      let coreWithEarliestTime = cores.reduce((earliest, current) => earliest.currentTime <= current.currentTime ? earliest : current);
      job.startTime = Math.max(coreWithEarliestTime.currentTime, job.arrivalTime);
      job.endTime = job.startTime + job.burstTime;
      coreWithEarliestTime.currentTime = job.endTime;
      coreWithEarliestTime.jobs.push(job);
    });
  }

  // Handle SJF scheduling
  else if (selectedAlgorithm === 'sjf') {
    while (jobsToSchedule.length > 0) {
      let coreWithEarliestTime = cores.reduce((earliest, current) => earliest.currentTime <= current.currentTime ? earliest : current);

      // Find jobs that have arrived by the current time of the earliest core
      let availableJobs = jobsToSchedule.filter(job => job.arrivalTime <= coreWithEarliestTime.currentTime);

      // If no jobs are available yet, advance the time to the next job's arrival
      if (availableJobs.length === 0) {
        let nextJobArrival = Math.min(...jobsToSchedule.map(job => job.arrivalTime));
        coreWithEarliestTime.currentTime = nextJobArrival;
        availableJobs = jobsToSchedule.filter(job => job.arrivalTime <= coreWithEarliestTime.currentTime);
      }

      // Now select the job with the shortest burst time from available jobs
      let jobToSchedule = availableJobs.sort((a, b) => a.burstTime - b.burstTime)[0];

      // Schedule the selected job
      jobToSchedule.startTime = Math.max(coreWithEarliestTime.currentTime, jobToSchedule.arrivalTime);
      jobToSchedule.endTime = jobToSchedule.startTime + jobToSchedule.burstTime;
      coreWithEarliestTime.currentTime = jobToSchedule.endTime;
      coreWithEarliestTime.jobs.push(jobToSchedule);

      // Remove the scheduled job from the list of jobs to schedule
      jobsToSchedule = jobsToSchedule.filter(job => job.id !== jobToSchedule.id);
    }
  }

  // Update the global jobs array with the scheduled jobs for UI update
  jobs = cores.flatMap(core => core.jobs);

  // Update the UI
  createTimelineGraphic();
  updateUI();
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
    // selectedAlgorithm = event.target.value;
    // if (selectedAlgorithm) {
    //     scheduleJobsMultiCore();
    // }
    // updateUI();
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




