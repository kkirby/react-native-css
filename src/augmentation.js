module.exports = {
	augmentationStorage: null,
	augmentationData: null,
	augmentationStatus: false,
	augmentations: [],
	setAugmentationStatus(status){
		this.augmentationStatus = status;
	},
	addAugmentation(augmentation){
		if(this.augmentationStatus){
			this.augmentations.push(augmentation);
		}
	},
	start(){
		if(this.augmentationStatus){
			this.augmentationStorage = [];
			this.augmentationData = {
				name,
				props,
				parentStyleInfo,
				styleInfo,
				styleAndProps,
				debugInfo,
				style
			};
			this.augmentations.forEach((augmentation,i) => {
				this.augmentationStorage[i] = {};
				if(augmentation.before){
					augmentation.before({
						data: this.augmentationData,
						storage: this.augmentationStorage[i]
					});
				}
			});
		}
	},
	end(element){
		if(this.augmentationStatus){
			this.augmentations.forEach((augmentation,i) => {
				if(augmentation.after){
					augmentation.after({
						data: this.augmentationData,
						storage: this.augmentationStorage[i],
						element
					});
				}
			});
		}
	}
};