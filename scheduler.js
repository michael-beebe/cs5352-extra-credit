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
  // Reset cores
  initializeCores(numberOfCores);

  // Create a deep copy of the jobs array to manipulate during scheduling
  let jobsToSchedule = JSON.parse(JSON.stringify(jobs));
  let currentTime = 0;

  // Clear previous jobs from cores
  cores.forEach(core => core.jobs = []);
  cores.forEach(core => core.currentTime = 0);

  // Sort and schedule jobs based on the selected algorithm
  if (selectedAlgorithm === 'fcfs') {
    // Sort by arrival time for FCFS
    jobsToSchedule.sort((a, b) => a.arrivalTime - b.arrivalTime);
  } else if (selectedAlgorithm === 'sjf') {
    // Sort by burst time for SJF, considering only jobs that have arrived
    jobsToSchedule.sort((a, b) => {
      if (a.arrivalTime <= currentTime && b.arrivalTime <= currentTime) {
        return a.burstTime - b.burstTime;
      }
      return a.arrivalTime - b.arrivalTime;
    });
  }

  // Assign jobs to cores based on the sorted order
  jobsToSchedule.forEach(job => {
    let coreWithEarliestTime = cores.reduce((earliest, current) => {
      return (earliest.currentTime <= current.currentTime) ? earliest : current;
    });

    // Schedule the job on the core with the earliest available time
    if (job.arrivalTime > coreWithEarliestTime.currentTime) {
      coreWithEarliestTime.currentTime = job.arrivalTime;
    }
    job.startTime = coreWithEarliestTime.currentTime;
    job.endTime = job.startTime + job.burstTime;
    coreWithEarliestTime.currentTime = job.endTime;
    coreWithEarliestTime.jobs.push(job);
  });

  // Update the global jobs array with the scheduled jobs
  jobs = cores.flatMap(core => core.jobs);

  // Update the timeline visualization
  createTimelineGraphic();
}


// Function to create a detailed timeline graphic
function createTimelineGraphic() {
  const timelineContainer = document.getElementById('timeline-container');
  timelineContainer.innerHTML = ''; // Clear existing timeline

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
    if (selectedAlgorithm) {
      scheduleJobsMultiCore();
    }
    updateUI();
  });
  // document.getElementById('algorithm-select').addEventListener('change', function(event) {
  //   selectedAlgorithm = event.target.value;
  //   scheduleJobsMultiCore(); // Re-schedule jobs based on the new algorithm
  //   updateUI(); // Update the table and timeline
  // });

  // Event listener for CPU cores input change
  document.getElementById('cpu-cores').addEventListener('change', function(event) {
    numberOfCores = parseInt(event.target.value, 10);
    if (selectedAlgorithm) {
      scheduleJobsMultiCore();
    }
    updateUI();
  });
}

// Check if the DOM is fully loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', setupEventListeners);
} else {
  setupEventListeners();
}