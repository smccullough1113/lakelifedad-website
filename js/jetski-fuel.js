const form = document.querySelector("#fuel-form");
const errorMessage = document.querySelector("#form-error");
const resultsCard = document.querySelector(".results-card");
const resultsIntro = document.querySelector(".results-intro");
const resultsValues = document.querySelector(".results-values");
const resultsTitle = document.querySelector("#results-title");
const resultsFootnote = document.querySelector("#results-footnote");
const currentYear = document.querySelector("#current-year");
const modeSelect = document.querySelector("#calculation-mode");
const tripModeInputs = [...document.querySelectorAll('input[name="trip-mode"]')];
const availableField = document.querySelector("#available-field");
const mpgField = document.querySelector("#mpg-field");
const gphField = document.querySelector("#gph-field");
const speedField = document.querySelector("#speed-field");
const primaryLabel = document.querySelector("#primary-label");
const primaryResult = document.querySelector("#primary-result");
const primaryNote = document.querySelector("#primary-note");
const secondaryLabelOne = document.querySelector("#secondary-label-one");
const secondaryResultOne = document.querySelector("#secondary-result-one");
const secondaryLabelTwo = document.querySelector("#secondary-label-two");
const secondaryResultTwo = document.querySelector("#secondary-result-two");
const secondaryLabelThree = document.querySelector("#secondary-label-three");
const secondaryResultThree = document.querySelector("#secondary-result-three");
const resultStatus = document.querySelector("#result-status");
const reserveResult = document.querySelector("#reserve-result");
const emergencyResult = document.querySelector("#emergency-result");
const rangeResult = document.querySelector("#range-result");
const rideTimeResult = document.querySelector("#ride-time-result");
const economyResult = document.querySelector("#economy-result");

const updateCalculationMode = () => {
  const usesGallonsPerHour = modeSelect.value === "gph";
  mpgField.hidden = usesGallonsPerHour;
  mpgField.querySelector("input").disabled = usesGallonsPerHour;
  gphField.hidden = !usesGallonsPerHour;
  gphField.querySelector("input").disabled = !usesGallonsPerHour;
  speedField.hidden = !usesGallonsPerHour;
  speedField.querySelector("input").disabled = !usesGallonsPerHour;
};

const updateTripMode = () => {
  resultsValues.hidden = true;
  resultsIntro.hidden = false;
  errorMessage.hidden = true;
};

modeSelect.addEventListener("change", () => {
  updateCalculationMode();
  errorMessage.hidden = true;
});
tripModeInputs.forEach((input) => input.addEventListener("change", updateTripMode));
updateCalculationMode();
updateTripMode();

if (currentYear) {
  currentYear.textContent = String(new Date().getFullYear());
}

if (form instanceof HTMLFormElement) {
  form.addEventListener("reset", () => {
    window.setTimeout(() => {
      updateCalculationMode();
      updateTripMode();
      resultsTitle.textContent = "Your ride outlook";
      resultStatus.hidden = true;
      resultStatus.classList.remove("status-short");
    });
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    errorMessage.hidden = true;

    if (!form.reportValidity()) return;

    const formData = new FormData(form);
    const tripMode = formData.get("trip-mode");
    const economyMode = formData.get("economy-mode");
    const distance = Number(formData.get("distance"));
    const availableFuel = Number(formData.get("available"));
    const reserveFuel = Number(formData.get("reserve"));
    const economy = Number(formData.get("mpg"));
    const burn = Number(formData.get("burn"));
    const speed = Number(formData.get("speed"));

    if (!Number.isFinite(distance) || distance <= 0 || !Number.isFinite(reserveFuel) || reserveFuel < 0) {
      errorMessage.textContent = "Enter a distance greater than zero and a zero-or-greater reserve amount.";
      errorMessage.hidden = false;
      return;
    }

    let milesPerGallon;
    if (economyMode === "mpg") {
      if (!Number.isFinite(economy) || economy <= 0) {
        errorMessage.textContent = "Enter a positive miles-per-gallon estimate.";
        errorMessage.hidden = false;
        return;
      }
      milesPerGallon = economy;
    } else {
      if (![burn, speed].every(Number.isFinite) || burn <= 0 || speed <= 0) {
        errorMessage.textContent = "Enter a positive hourly burn rate and average riding speed.";
        errorMessage.hidden = false;
        return;
      }
      milesPerGallon = speed / burn;
    }

    const fuelForDistance = distance / milesPerGallon;
    if (!Number.isFinite(availableFuel) || availableFuel <= 0) {
      errorMessage.textContent = "Enter the amount of fuel currently onboard.";
      errorMessage.hidden = false;
      return;
    }

    const emergencyFuel = tripMode === "plan" ? fuelForDistance / 3 : 0;
    const totalFuelNeeded = fuelForDistance + reserveFuel + emergencyFuel;
    const additionalFuelNeeded = Math.max(0, totalFuelNeeded - availableFuel);
    const hasEnoughFuel = additionalFuelNeeded === 0;
    const fuelAfterTripAndReserve = Math.max(0, availableFuel - fuelForDistance - reserveFuel);
    const estimatedRange = Math.max(0, availableFuel - reserveFuel) * milesPerGallon;
    const estimatedRideMinutes = economyMode === "gph" ? Math.round(distance / speed * 60) : null;
    const rideHours = estimatedRideMinutes === null ? 0 : Math.floor(estimatedRideMinutes / 60);
    const rideMinutes = estimatedRideMinutes === null ? 0 : estimatedRideMinutes % 60;
    primaryLabel.textContent = tripMode === "plan" ? "Total fuel target" : "Fuel needed, including reserve";
    primaryResult.textContent = `${totalFuelNeeded.toFixed(2)} gal`;
    primaryNote.textContent = `for ${distance.toLocaleString()} planned miles`;
    secondaryLabelOne.textContent = "Trip fuel needed";
    secondaryResultOne.textContent = `${fuelForDistance.toFixed(2)} gal`;
    secondaryLabelTwo.textContent = "Fuel currently onboard";
    secondaryResultTwo.textContent = `${availableFuel.toFixed(2)} gal`;
    secondaryLabelThree.textContent = "More fuel to bring";
    secondaryResultThree.textContent = `${additionalFuelNeeded.toFixed(2)} gal`;
    reserveResult.textContent = `${reserveFuel.toFixed(2)} gal`;
    emergencyResult.textContent = tripMode === "plan" ? `${emergencyFuel.toFixed(2)} gal` : "Not included";
    resultStatus.textContent = hasEnoughFuel ? "FUEL TARGET MET" : "MORE FUEL TO BRING";
    resultStatus.classList.toggle("status-short", !hasEnoughFuel);
    resultsFootnote.textContent = tripMode === "plan"
      ? `Target: ${fuelForDistance.toFixed(2)} gal trip fuel + ${reserveFuel.toFixed(2)} gal reserve + ${emergencyFuel.toFixed(2)} gal emergency allowance. ${hasEnoughFuel ? `${fuelAfterTripAndReserve.toFixed(2)} gal remains beyond trip fuel and reserve.` : `Bring ${additionalFuelNeeded.toFixed(2)} more gallons to meet the target.`}`
      : `Target: ${fuelForDistance.toFixed(2)} gal trip fuel + ${reserveFuel.toFixed(2)} gal reserve. ${hasEnoughFuel ? `${fuelAfterTripAndReserve.toFixed(2)} gal remains beyond trip fuel and reserve.` : `Bring ${additionalFuelNeeded.toFixed(2)} more gallons to meet trip fuel and reserve.`}`;

    rangeResult.textContent = `${estimatedRange.toFixed(1)} mi`;
    rideTimeResult.textContent = estimatedRideMinutes === null
      ? "Not estimated"
      : rideHours > 0
        ? `${rideHours} hr${rideHours === 1 ? "" : "s"} ${String(rideMinutes).padStart(2, "0")} min`
        : `${rideMinutes} min`;
    economyResult.textContent = `${milesPerGallon.toFixed(1)} mi/gal`;
    resultsTitle.textContent = "Estimated for your ride.";
    resultStatus.hidden = false;
    resultsIntro.hidden = true;
    resultsValues.hidden = false;
    resultsCard.scrollIntoView({ behavior: "smooth", block: "nearest" });
  });
}
