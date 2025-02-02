/*
    belaUI - web UI for the BELABOX project
    Copyright (C) 2020-2021 BELABOX project

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.
    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

let prev_modems;
let prev_temps;
let update_timer;
let isStreaming = false;

function enableUpdates() {
  update_timer = setInterval(updateStatus, 1000);
}

async function updateStatus() {
  const response = await fetch("/data");
  if (!response.ok) return;
  const data = await response.json();
  updateStartStopButton(data);
  updateModems(data);
  updateTemps(data);
}

function updateStartStopButton(data) {
  
  isStreaming = data["active"];

  if (!isStreaming) {
    updateButtonAndSettingsShow({
      add: "btn-success",
      remove: "btn-danger",
      text: currentLanguageData['start'],
      enabled: true,
      settingsShow: true,
    });
  } else {
    updateButtonAndSettingsShow({
      add: "btn-danger",
      remove: "btn-success",
      text: currentLanguageData['stop'],
      enabled: true,
      settingsShow: false,
    });
  }
}

function updateButton({ add, remove, text, enabled }) {
  const button = document.getElementById("startStop");

  button.classList.add(add);
  button.classList.remove(remove);

  button.innerHTML = text;
  if (enabled) {
    button.removeAttribute("disabled")
  } else {
    button.setAttribute("disabled", true);
  }
}

function updateButtonAndSettingsShow({ add, remove, text, enabled, settingsShow }) {
  const settingsDivs = document.getElementById("settings");

  if (settingsShow) {
    settingsDivs.classList.remove("d-none");
  } else {
    settingsDivs.classList.add("d-none");
  }

  updateButton({add, remove, text, enabled });
}

function updateModems(data) {
  modems = data.modems;

  const modemsList = document.getElementById("modems");
  let html = "";

  modems.forEach((modem, i) => {
    let txb = 0;

    if (prev_modems && i in prev_modems && "txb" in prev_modems[i]) {
      txb = modem.txb - prev_modems[i].txb;
      txb = Math.round((txb * 8) / 1024);
    }

    html += `<tr>
        <td>${modem.i}</td>
        <td>${modem.ip}</td>
        <td>${txb} Kbps</td>
      </tr>`;
  });

  modemsList.innerHTML = html;
  prev_modems = modems;
}

function updateTemps(data) {
  temps = data.temps;

  const tempsList = document.getElementById("temps");
  let html = "";

  temps.forEach((temps, i) => {
    let type_value = 0;

    //if (prev_temps && i in prev_temps && "type_value" in prev_temps[i]) {
      //type_value = temps.type_value - prev_temps[i].type_value;
      type_value = Math.round(temps.type_value  / 1000);
    //}

    html += `<tr>
        <td>${temps.i}</td>
        <td>${temps.type_name}</td>
        <td>${type_value} °C</td>
      </tr>`;
  });

  tempsList.innerHTML = html;
  prev_temps = temps;
}

async function getPipelines() {
  const response = await fetch("/pipelines");
  const pipelines = await response.json();

  if (!response.ok) return;

  const pipelinesSelect = document.getElementById("pipelines");

  pipelines.forEach(({ id, selected, name }) => {
    const option = document.createElement("option");
    option.value = id;
    option.selected = selected;
    option.innerText = name;

    pipelinesSelect.append(option);
  });
}

async function getConfig() {
  const response = await fetch("/config");
  const config = await response.json();

  if (!response.ok) return;

  init_bitrate_slider([config.min_br ?? 500, config.max_br ?? 5000]);
  init_delay_slider(config.delay ?? 0);
  init_srt_latency_slider(config.srt_latency ?? 2000);

  document.getElementById("srtStreamid").value = config["srt_streamid"] ?? "";
  document.getElementById("srtlaAddr").value = config["srtla_addr"] ?? "";
  document.getElementById("srtlaPort").value = config["srtla_port"] ?? "";
}

function show_delay(audiodelay_text, value) {
  document.getElementById("delayValue").value = `${audiodelay_text}: ${value} ms`;
}

function init_delay_slider(default_delay) {
  $("#delaySlider").slider({
    min: -2000,
    max: 2000,
    step: 20,
    value: default_delay,
    slide: (event, ui) => {
      show_delay(currentLanguageData["audio-delay"], ui.value);
    },
  });
  show_delay(currentLanguageData["audio-delay"], default_delay);
}

function showBitrate(bitrate_text, values) {
  document.getElementById(
    "bitrateValues"
  ).value = `${bitrate_text}: ${values[0]} - ${values[1]} Kbps`;
}

function setBitrate([min_br, max_br]) {
  let formBody = new URLSearchParams();
  formBody.set("min_br", min_br);
  formBody.set("max_br", max_br);

  fetch("/bitrate", {
    method: "POST",
    body: formBody,
  });
}

function init_bitrate_slider(bitrate_defaults) {
  $("#bitrateSlider").slider({
    range: true,
    min: 500,
    max: 12000,
    step: 100,
    values: bitrate_defaults,
    slide: (event, ui) => {
      showBitrate(currentLanguageData["bitrate"], ui.values);
      setBitrate(ui.values);
    },
  });
  showBitrate(currentLanguageData["bitrate"], bitrate_defaults);
}

function show_srt_latency(latency_text, value) {
  document.getElementById("srtLatencyValue").value = `${latency_text}: ${value} ms`;
}

function init_srt_latency_slider(default_latency) {
  $("#srtLatencySlider").slider({
    min: 100,
    max: 4000,
    step: 100,
    value: default_latency,
    slide: (event, ui) => {
      show_srt_latency(currentLanguageData["srt-latency"], ui.value);
    },
  });
  show_srt_latency(currentLanguageData["srt-latency"], default_latency);
}

function show_error(message) {
  $("#errorMsg>span").text(message);
  $("#errorMsg").show();
}

function hide_error() {
  $("#errorMsg").hide();
}

async function start() {
  hide_error();

  const [min_br, max_br] = $("#bitrateSlider").slider("values");

  let formBody = new URLSearchParams();
  formBody.set("pipeline", document.getElementById("pipelines").value);
  formBody.set("delay", $("#delaySlider").slider("value"));
  formBody.set("min_br", min_br);
  formBody.set("max_br", max_br);
  formBody.set("srtla_addr", document.getElementById("srtlaAddr").value);
  formBody.set("srtla_port", document.getElementById("srtlaPort").value);
  formBody.set("srt_streamid", document.getElementById("srtStreamid").value);
  formBody.set("srt_latency", $("#srtLatencySlider").slider("value"));

  const response = await fetch("/start", {
    method: "POST",
    body: formBody,
  });

  if (!response.ok) {
    response.text().then(function(error) {
      show_error("Failed to start the stream: " + error);
    });
  }
  enableUpdates();
}

async function stop() {
  const response = await fetch("/stop", { method: "POST" });
  if (response.ok) {
    updateStatus();
    enableUpdates();
  }
}

function show_overlay(title, text) {
  /*
  $('#overlayText p').text(text);
  $('.overlay').show();
  setTimeout(function(){
    $('#refreshBtn').show();
  }, 2000);
  */
  $('#centeredModalLongTitle').text(title);
  $('#centeredModal .modal-body').text(text);
  $('#centeredModal').modal('show');
}

function send_command(cmd) {
  /*
  let formBody = new URLSearchParams();
  formBody.set("cmd", cmd);
  */
  /*
  const response = await fetch("/command", {
    method: "POST",
    body: formBody,
  });
  */
  console.log(cmd);
  $.post("/command", {"cmd":cmd}, function( data ) {
    switch(cmd) {
      case 'test':
        show_overlay('Test','BLA BLA');
        break;
	    case 'update':
        show_overlay(currentLanguageData["update"], data);
        break;
      case 'rollback':
        show_overlay(currentLanguageData["rollback"], data);
        break;
      case 'reboot':
        show_overlay(currentLanguageData["restart"], 'Restarting...');
        break;
      case 'mm':
        show_overlay(currentLanguageData["power-off"], 'Powered off');
        break;
    }
  });
  /*
  let response_json = response.json();
  let response_data = response_json.data;
  */
/*
  if (response.ok) {
    //clearInterval(update_timer);
    switch(cmd) {
      case 'test':
        show_overlay('Test','BLA BLA');
        break;
	    case 'update':
        show_overlay(currentLanguageData["update"], response_data);
        break;
      case 'rollback':
        show_overlay(currentLanguageData["rollback"], response_data);
        break;
      case 'reboot':
        show_overlay(currentLanguageData["restart"], 'Restarting...');
        break;
      case 'mm':
        show_overlay(currentLanguageData["power-off"], 'Powered off');
        break;
    }
    
  }
  */
}

document.getElementById("startStop").addEventListener("click", () => {
  clearInterval(update_timer);

  if (!isStreaming) {
    updateButton({text: currentLanguageData['starting'] + "..."});
    start();
  } else {
    stop();
  }
});

$('.command-btn').click(function() {
  send_command(this.id);
});

$('#refreshBtn').click(function() {
  location.reload();
});

$(".alert").on("close.bs.alert", function () {
  $(this).fadeOut(300);
  return false;
});

/* on jquery loaded */
$(function() {
	getPipelines();
	getConfig();
	updateStatus();
	enableUpdates();
});
