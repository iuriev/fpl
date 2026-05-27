# Spec: Transfer Position Logic

## Scenarios

### 1. Selecting a Midfielder for replacement
- **Given** I am on the Transfers screen
- **When** I click on a MID player to replace them
- **Then** the Player Picker Sheet should open
- **And** it should only show MID candidates
- **And** it should NOT show position filter tabs (ALL, DEF, MID, FWD)

### 2. Selecting a Goalkeeper for replacement
- **Given** I am on the Transfers screen
- **When** I click on a GK player to replace them
- **Then** the Player Picker Sheet should open
- **And** it should only show GK candidates
- **And** it should NOT show position filter tabs

### 3. Verification of Candidates
- **Given** I am replacing a DEF
- **Then** all players in the candidates list must have `position === 'DEF'`
