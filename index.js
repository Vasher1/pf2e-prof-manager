Hooks.on("renderActorSheet", (sheet, $html) => {
    const $button = $(
        '<a class="item-edit" style="float: right; position: relative; right: 3px; top: -2px; color: var(--primary);"><i class="fas fa-edit"></i></a>'
    ).on("click", () => {
        globalThis.PROF = sheet.actor;
        if (sheet.actor.ancestry && sheet.actor.background && sheet.actor.class && sheet.actor.heritage) {
            new Application({
                width: 400 + 20 * sheet.actor.data.data.details.level.value,
                height: 670,
                popOut: true,
                minimizable: true,
                resizable: false,
                id: "rule-element-generator",
                template: "modules/pf2e-prof-manager/application.html",
                title: "Skill Proficiency Manager",
            }).render(true);

            setTimeout(pageload, 100)
        } else {
            ui.notifications.info("PF2E Skill Proficiency Manager | Please Choose Ancestry, Background, Heritage, and Class");
        }
    });
    $html.find("h3:contains('Core Skills')").append($button);
});


let SkillUpLevels, SkillNames, Level, Class, Skills, Flags, SaveData, SelectedActor

function pageload(){    
    // Used
    SelectedActor = globalThis.PROF;
    Skills = SelectedActor.data.data.skills;
    Class = SelectedActor.class.data.data;
    Level = SelectedActor.data.data.details.level.value;
    SkillNames = Object.getOwnPropertyNames(Skills);
    Flags = SelectedActor.data.flags["pf2e-prof-manager"]?.prof;

    // Build UI
    SkillNames.forEach(skillName => {
        $(`<tr><td>${Skills[skillName].name}</td><td class="Scenter" id="S${skillName}"></td></tr>`).insertAfter($("#header"))
    })

    SkillUpLevels = [1];
    Class.skillIncreaseLevels.value.forEach(skillIncrease => {
        if (Level >= skillIncrease) {
            SkillUpLevels.push(skillIncrease);
        }
    });

    game.i18n.localize("Level");

    SkillUpLevels.forEach(level => {
        $(`<th class="Scenter S${level}">Level ${level}</th>`).insertBefore($("#LevelTitle"));
        SkillNames.forEach(skill => {
            $(`<td class="Scenter S${level}"><input type="checkbox" id="S${level}${skill}" data-name="${skill}" /></td>`).insertBefore($(`#S${skill}`))
        })
    });

    // Load save if it exists
    if (typeof Flags != "undefined") {
        //boosts (checking for shown in case of level down)
        for (let i of SkillNames) {
            for (let j of SkillUpLevels) {
                if (!$("#S" + j + i).is(":hidden")) {
                    $("#S" + j + i).prop("checked", Flags[i][SkillUpLevels.indexOf(j)]);
                }
           }
       }
    }

    update()

    $(':checkbox').change(function() {
        const skill = this.getAttribute("data-name");

        if (this.checked) {
            Skills[skill].rank = Skills[skill].rank + 1
        } else {
            Skills[skill].rank = Skills[skill].rank - 1
        }

        update();
    });

    $("#Sapply").on("click", () => {
        // Apply changes to actor
        SkillNames.forEach(skillName => {
            let stringName = `data.skills.${skillName}.rank`;

            SelectedActor.update({
                [stringName] : parseInt(Skills[skillName].rank)
            });
        });

        // Store choices
        SaveData = {};
        for (let i of SkillNames) {
            SaveData[i] = [];
            for (let j of SkillUpLevels) {
                SaveData[i].push($("#S" + j + i).is(":checked"));
            }
        }
        SelectedActor.setFlag("pf2e-prof-manager", "prof", SaveData);

        ui.notifications.info("PF2E Skill Proficiency Manager | Skill proficiencies applied");
    });
}

function update(){
    //set rank display
    for (let skill of SkillNames) {
        switch(Skills[skill].rank) {
            case 0:
                $("#S" + skill).html("Untrained");
                break;
            case 1:
                $("#S" + skill).html("Trained");
                break;
            case 2:
                $("#S" + skill).html("Expert");
                break;
            case 3:
                $("#S" + skill).html("Master");
                break;
            case 4:
                $("#S" + skill).html("Legendary");
                break;
          }
    }

    //disable SkillNames that can't be increased higher than their currently level yet
    for (let skill of SkillNames) {
        let rank = Skills[skill].rank

        SkillUpLevels.forEach(skillUpLevel => {

            if(skillUpLevel == 1 && rank >= 1){
                // Stop the user from getting above trained at level 1
                if(!$("#S" + skillUpLevel + skill).is(":checked")){
                    $("#S" + skillUpLevel + skill).prop("disabled", true);
                }
                
            } else if(rank >= 2 && skillUpLevel < 7){
                // Stop the user from getting master before level 7
                if(!$("#S" + skillUpLevel + skill).is(":checked")){
                    $("#S" + skillUpLevel + skill).prop("disabled", true);
                }

            } else if(rank >= 3 && skillUpLevel < 15){
                // Stop the user from getting legendary before level 15
                if(!$("#S" + skillUpLevel + skill).is(":checked")){
                    $("#S" + skillUpLevel + skill).prop("disabled", true);
                }

            } else if(rank >= 4){
                // Stop the user from getting above legendary
                if(!$("#S" + skillUpLevel + skill).is(":checked")){
                    $("#S" + skillUpLevel + skill).prop("disabled", true);
                }

            } else {
                $("#S" + skillUpLevel + skill).prop("disabled", false);
            }
        });
    }

    //check for filled increases
    for (let i of SkillUpLevels) {
        if(i == 1){
            // Don't allow changing of level 1 profs when above level one, this is because we have no way of knowing if they increased their int or not 
            if($(`.Scenter.S${i}`).find(":checked").length >= Class.trainedSkills.additional + SelectedActor.abilities.int.mod || Level > 1){
                $(`.Scenter.S${i}`).find(":not(:checked)").prop("disabled", true);
                $(`.Scenter.S${i}`).find(":checked").prop("disabled", true);
            } 
        } else{
            if($(`.Scenter.S${i}`).find(":checked").length){
                $(`.Scenter.S${i}`).find(":not(:checked)").prop("disabled", true);
            }
        }
    }
}