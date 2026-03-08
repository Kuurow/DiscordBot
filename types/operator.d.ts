interface AttributeData {
	maxHp: number;
	atk: number;
	def: number;
	magicResistance: number;
	cost: number;
	blockCnt: number;
	moveSpeed: number;
	attackSpeed: number;
	baseAttackTime: number;
	respawnTime: number;
	hpRecoveryPerSec: number;
	spRecoveryPerSec: number;
	maxDeployCount: number;
	maxDeckStackCnt: number;
	tauntLevel: number;
	massLevel: number;
	baseForceLevel: number;
	stunImmune: boolean;
	silenceImmune: boolean;
	sleepImmune: boolean;
	frozenImmune: boolean;
	levitateImmune: boolean;
	disarmedCombatImmune: boolean;
	fearedImmune: boolean;
	palsyImmune: boolean;
	attractImmune: boolean;
}

interface UnlockCond {
	phase: string;
	level: number;
}

interface Blackboard {
	key: string;
	value: number;
	valueStr: string | null;
}

interface ItemCost {
	id: string;
	count: number;
	type: string;
}

interface OperatorApiResponse {
	_id: string;
	meta: {
		createdIndex: number;
		updatedIndex: number;
		hash: string;
		created: string;
		updated: string;
		date: number;
	};
	canon: string;
	keys: string[];
	value: {
		id: string;
		archetype: string;
		bases: Array<{
			condition: {
				buffId: string;
				cond: UnlockCond;
			};
			skill: {
				buffId: string;
				buffName: string;
				buffIcon: string;
				skillIcon: string;
				sortId: number;
				buffColor: string;
				textColor: string;
				buffCategory: string;
				roomType: string;
				description: string;
			};
		}>;
		data: {
			name: string;
			description: string;
			sortIndex: number;
			spTargetType: string;
			spTargetId: string | null;
			canUseGeneralPotentialItem: boolean;
			canUseActivityPotentialItem: boolean;
			potentialItemId: string;
			activityPotentialItemId: string | null;
			classicPotentialItemId: string;
			nationId: string;
			groupId: string | null;
			teamId: string | null;
			displayNumber: string;
			appellation: string;
			position: string;
			tagList: string[];
			itemUsage: string;
			itemDesc: string;
			itemObtainApproach: string;
			isNotObtainable: boolean;
			isSpChar: boolean;
			maxPotentialLevel: number;
			rarity: string;
			profession: string;
			subProfessionId: string;
			trait: string | null;
			phases: Array<{
				characterPrefabKey: string;
				rangeId: string;
				maxLevel: number;
				attributesKeyFrames: Array<{
					level: number;
					data: AttributeData;
				}>;
				evolveCost: ItemCost[] | null;
			}>;
			skills: Array<{
				skillId: string;
				overridePrefabKey: string | null;
				overrideTokenKey: string | null;
				levelUpCostCond: Array<{
					unlockCond: UnlockCond;
					lvlUpTime: number;
					levelUpCost: ItemCost[];
				}>;
				unlockCond: UnlockCond;
			}>;
			displayTokenDict: null;
			talents: Array<{
				candidates: Array<{
					unlockCondition: UnlockCond;
					requiredPotentialRank: number;
					prefabKey: string;
					name: string;
					description: string;
					rangeId: string | null;
					blackboard: Blackboard[];
					tokenKey: string | null;
					isHideTalent: boolean;
				}>;
			}>;
			potentialRanks: Array<{
				type: string;
				description: string;
				buff: {
					attributes: {
						abnormalFlags: null;
						abnormalImmunes: null;
						abnormalAntis: null;
						abnormalCombos: null;
						abnormalComboImmunes: null;
						attributeModifiers: Array<{
							attributeType: string;
							formulaItem: string;
							value: number;
							loadFromBlackboard: boolean;
							fetchBaseValueFromSourceEntity: boolean;
						}>;
					};
				} | null;
				equivalentCost: null;
			}>;
			favorKeyFrames: Array<{
				level: number;
				data: AttributeData;
			}>;
			allSkillLvlup: Array<{
				unlockCond: UnlockCond;
				lvlUpCost: ItemCost[];
			}>;
		};
		modules: Array<{
			info: {
				uniEquipId: string;
				uniEquipName: string;
				uniEquipIcon: string;
				uniEquipDesc: string;
				typeIcon: string;
				typeName1: string;
				typeName2: string;
				equipShiningColor: string;
				showEvolvePhase: string;
				unlockEvolvePhase: string;
				charId: string;
				tmplId: string | null;
				showLevel: number;
				unlockLevel: number;
				missionList: string[];
				unlockFavors: Record<string, number>;
				itemCost: Record<string, ItemCost[]>;
				type: string;
				uniEquipGetTime: number;
				uniEquipShowEnd: number;
				charEquipOrder: number;
				hasUnlockMission: boolean;
				isSpecialEquip: boolean;
				specialEquipDesc: string | null;
				specialEquipColor: string | null;
				charColor: string;
			};
			data: {
				phases: Array<{
					equipLevel: number;
					parts: Array<{
						resKey: string;
						target: string;
						isToken: boolean;
						validInGameTag: string | null;
						validInMapTag: string | null;
						addOrOverrideTalentDataBundle: {
							candidates: Array<{
								displayRangeId: boolean;
								upgradeDescription: string;
								talentIndex: number;
								unlockCondition: UnlockCond;
								requiredPotentialRank: number;
								prefabKey: string;
								name: string;
								description: string | null;
								rangeId: string | null;
								blackboard: Blackboard[];
								tokenKey: string | null;
								isHideTalent: boolean;
							}> | null;
						};
						overrideTraitDataBundle: {
							candidates: Array<{
								additionalDescription: string;
								unlockCondition: UnlockCond;
								requiredPotentialRank: number;
								blackboard: Blackboard[];
								overrideDescripton: string | null;
								prefabKey: string | null;
								rangeId: string | null;
							}> | null;
						};
					}>;
					attributeBlackboard: Blackboard[];
					tokenAttributeBlackboard: Record<string, unknown>;
				}>;
			};
		}>;
		paradox: {
			excel: {
				charId: string;
				stageId: string;
				levelId: string;
				zoneId: string;
				code: string;
				name: string;
				loadingPicId: string;
				description: string;
				unlockParam: Array<{
					unlockType: string;
					unlockParam1: string;
					unlockParam2: string;
					unlockParam3: string | null;
				}>;
				rewardItem: ItemCost[];
				stageGetTime: number;
			};
			levels: {
				options: {
					characterLimit: number;
					maxLifePoint: number;
					initialCost: number;
					maxCost: number;
					costIncreaseTime: number;
					moveMultiplier: number;
					steeringEnabled: boolean;
					isTrainingLevel: boolean;
					isHardTrainingLevel: boolean;
					isPredefinedCardsSelectable: boolean;
					displayRestTime: boolean;
					maxPlayTime: number;
					functionDisableMask: string;
					configBlackBoard: null;
				};
				mapData: {
					map: number[][];
					tiles: Array<{
						tileKey: string;
						heightType: string;
						buildableType: string;
						passableMask: string;
						playerSideMask: string;
						blackboard: null;
						effects: null;
					}>;
				};
				routes: Array<{
					motionMode: string;
					startPosition: { row: number; col: number };
					endPosition: { row: number; col: number };
					spawnRandomRange: { x: number; y: number };
					spawnOffset: { x: number; y: number };
					checkpoints: Array<{
						type: string;
						time: number;
						position: { row: number; col: number };
						reachOffset: { x: number; y: number };
						randomizeReachOffset: boolean;
						reachDistance: number;
					}> | null;
					allowDiagonalMove: boolean;
					visitEveryTileCenter: boolean;
					visitEveryNodeCenter: boolean;
					visitEveryCheckPoint: boolean;
				}>;
				enemyDbRefs: Array<{
					useDb: boolean;
					id: string;
					level: number;
					overwrittenData: Record<string, unknown> | null;
				}>;
				waves: Array<{
					preDelay: number;
					postDelay: number;
					maxTimeWaitingForNextWave: number;
					fragments: Array<{
						preDelay: number;
						actions: Array<{
							actionType: string;
							managedByScheduler: boolean;
							key: string;
							count: number;
							preDelay: number;
							interval: number;
							routeIndex: number;
							blockFragment: boolean;
							autoPreviewRoute: boolean;
							autoDisplayEnemyInfo: boolean;
							isUnharmfulAndAlwaysCountAsKilled: boolean;
							hiddenGroup: null;
							randomSpawnGroupKey: null;
							randomSpawnGroupPackKey: null;
							randomType: string;
							refreshType: string;
							weight: number;
							dontBlockWave: boolean;
							forceBlockWaveInBranch: boolean;
						}>;
					}>;
				}>;
				predefines: {
					characterCards: Array<{
						hidden: boolean;
						alias: string | null;
						uniEquipIds: null;
						showSpIllust: boolean;
						masterInfos: null;
						inst: {
							characterKey: string;
							level: number;
							phase: string;
							favorPoint: number;
							potentialRank: number;
						};
						skillIndex: number;
						mainSkillLvl: number;
						skinId: null;
						tmplId: null;
						overrideSkillBlackboard: null;
					}>;
					tokenCards: Array<{
						initialCnt: number;
						hidden: boolean;
						alias: string;
						inst: {
							characterKey: string;
							level: number;
							phase: string;
							favorPoint: number;
							potentialRank: number;
						};
						skillIndex: number;
						mainSkillLvl: number;
					}>;
				};
			};
		};
		range: {
			id: string;
			direction: number;
			grids: Array<{ row: number; col: number }>;
		};
		recruit: number;
		skills: Array<{
			deploy: {
				skillId: string;
				overridePrefabKey: string | null;
				overrideTokenKey: string | null;
				levelUpCostCond: Array<{
					unlockCond: UnlockCond;
					lvlUpTime: number;
					levelUpCost: ItemCost[];
				}>;
				unlockCond: UnlockCond;
			};
			excel: {
				skillId: string;
				iconId: string | null;
				hidden: boolean;
				levels: Array<{
					name: string;
					rangeId: string | null;
					description: string;
					skillType: string;
					durationType: string;
					spData: {
						spType: string;
						levelUpCost: null;
						maxChargeTime: number;
						spCost: number;
						initSp: number;
						increment: number;
					};
					prefabId: string;
					duration: number;
					blackboard: Blackboard[];
				}>;
			};
		}>;
		skins: Array<{
			skinId: string;
			charId: string;
			tokenSkinMap: null;
			illustId: string;
			spIllustId: null;
			dynIllustId: null;
			avatarId: string;
			portraitId: string;
			buildingId: string | null;
			battleSkin: {
				overwritePrefab: boolean;
				skinOrPrefabId: string;
			};
			isBuySkin: boolean;
			tmplId: null;
			voiceId: null;
			voiceType: string;
			displaySkin: {
				skinName: string | null;
				colorList: string[];
				titleList: string[];
				modelName: string;
				drawerList: string[];
				designerList: null;
				skinGroupId: string;
				skinGroupName: string;
				skinGroupSortIndex: number;
				content: string;
				dialog: null;
				usage: null;
				description: null;
				obtainApproach: null;
				sortId: number;
				displayTagId: null;
				getTime: number;
				onYear: number;
				onPeriod: number;
			};
		}>;
	};
}
