import { Request, Response } from 'express';
import { approveReport, createReport, deleteReport, filterReports, getReportFromID, getSimilarReports, updateReport } from '../util/database/report.database';
import { ISearchFilter, IVISORInput } from '../util/formats/report.format';
import { LOG } from '../util';
import { deleteImageFromKey, getAllImagesForId, updateDescriptionFromKey, uploadImageForId } from '../util/image-manager';

function checkVisorFormat(visor: any): boolean {
    const reportName = visor.reportName && typeof(visor.reportName) == 'string';
    const published = visor.published && typeof(visor.published) == 'string';
    const visorLocation = visor.visorLocation && typeof(visor.visorLocation) == 'object';
    const reportMeta = visor.reportMeta && typeof(visor.reportMeta) == 'object';
    const locationDetails = visor.locationDetails && typeof(visor.locationDetails) == 'object';
    const navigation = visor.navigation && typeof(visor.navigation) == 'object';
    return reportName && published && visorLocation && reportMeta && locationDetails && navigation;
}

function createVISOR(req: Request, res: Response) {
    const visor = req.body;
    if (visor && checkVisorFormat(visor)) {
        const published = visor.published === 'true';
        delete visor['published'];
        createReport(published, res.locals.orgName, visor as IVISORInput, (success, id) => {
            if (success && id) {
                return res.status(200).json({
                    message: 'Successfully created the VISOR Report.',
                    code: 'Success',
                    data: {
                        id
                    }
                });
            } else {
                return res.status(500).json({
                    message: 'Could not create the VISOR Report, please check your Information and try again.',
                    code: 'InternalError'
                });
            }
        })
    } else {
        return res.status(400).json({
            message: 'Please provide a valid VISOR Report as a body.',
            code: 'IncompleteBody'
        })
    }
}

function listVISORs(req: Request, res: Response) {
    const { name, published, location, meta, approved, keyword, length, from, to } = req.query;
    const filter: ISearchFilter = {
        name: name ? typeof(name) == 'string' ? name : undefined : undefined,
        published: published ? typeof(published) == 'string' ? published : undefined : undefined,
        location: location ? typeof(location) == 'string' ? JSON.parse(location) : undefined : undefined,
        meta: meta ? typeof(meta) == 'string' ? JSON.parse(meta) : undefined : undefined,
        approved: approved ? typeof(approved) == 'string' ? approved.toLowerCase() : undefined : undefined,
        keyword: keyword ? typeof(keyword) == 'string' ? keyword : undefined : undefined,
        length: length ? typeof(length) == 'string' ? Number(length) : undefined : undefined,
        from: from ? typeof(from) == 'string' ? Number(from) : undefined : undefined,
        to: to ? typeof(to) == 'string' ? Number(to) : undefined : undefined
    }
    filterReports(filter, res.locals.orgName, (success, data, count) => {
        if (success && data && count) {
            return res.status(200).json({
                message: 'Successfully filtered the reports.',
                code: 'Success',
                data: {
                    count,
                    reports: data
                }
            });
        } else {
            return res.status(404).json({
                message: 'No reports found with your settings, please try again with different settings.',
                code: 'NotFound'
            })
        }
    });
}

function getVISOR(req: Request, res: Response) {
    const { id } = req.query;
    if (id && typeof(id) == 'string') {
        getReportFromID(res.locals.orgName, id, (success, data) => {
            if (success && data) {
                return res.status(200).json({
                    message: 'Successfully fetched the VISOR Report.',
                    code: 'Success',
                    data
                });
            } else {
                return res.status(404).json({
                    message: 'Could not find the Report specified, please try another id.',
                    code: 'NoFound'
                });
            }
        })
    } else {
        return res.status(400).json({
            message: 'Could not find parameter: "id", please specify a "id" to search for.',
            code: 'IncompleteBody'
        })
    }
}

function updateVISOR(req: Request, res: Response) {
    const { id } = req.query;
    const visor = req.body;
    if (id && typeof(id) == 'string' && visor && checkVisorFormat(visor)) {
        delete visor['approved'];
        const published = visor.published === 'true';
        delete visor['published'];

        updateReport(published, res.locals.orgName, visor as IVISORInput, id, (success, id) => {
            if (success && id) {
                return res.status(200).json({
                    message: 'Successfully updated the VISOR Report.',
                    code: 'Success',
                    data: {
                        id
                    }
                });
            } else {
                return res.status(500).json({
                    message: 'It could be, that this report is approved and approved Reports cannot be changed or your Input is faulty. Either way: Could not update the VISOR Report, please check the report Information and try again.',
                    code: 'InternalError'
                });
            }
        });
        
    } else {
        return res.status(400).json({
            message: 'Please provide a valid VISOR Report as a body. And a valid id as a parameter.',
            code: 'IncompleteBody'
        })
    }
}

function approveVISOR(req: Request, res: Response) {
    const { id, approverHandle, approveReason } = req.body;
    if (id && approveReason) {
        const handle = typeof(approverHandle) == 'string' ? approverHandle : res.locals.handle;
        approveReport(res.locals.orgName, id, (success) => {
            if (success) {
                LOG.warn(`User: ${handle} approved: ${id} with reason: ${approveReason}`);
                return res.status(200).json({
                    message: 'Successfully approved the VISOR Report.',
                    code: 'Success',
                });
            } else {
                return res.status(500).json({
                    message: 'Could not approve the VISOR Report, please check your Information and try again.',
                    code: 'InternalError'
                });
            }
        })
    }
}

function deleteVISOR(req: Request, res: Response) {
    const { id, deletionReason } = req.body;
    if (id && deletionReason) {
        deleteReport(res.locals.orgName, id, (success) => {
            if(success) {
                LOG.warn(`User: ${res.locals.handle} deleted: ${id} with reason: ${deletionReason}`);
                return res.status(200).json({
                    message: 'Successfully deleted the VISOR Report.',
                    code: 'Success',
                });
            } else {
                return res.status(500).json({
                    message: 'Could not delete the VISOR Report, please check your Information and try again.',
                    code: 'InternalError'
                });
            }
        })
    } else {
        return res.status(400).json({
            message: 'Please provide a body, with "id", "name" and "deletionReason".',
            code: 'IncompleteBody'
        })
    }
}

function uploadImage(req: Request, res: Response) {
    const { id } = req.query;
    const { image } = req.files ? req.files : { image: undefined };
    const { description } = req.body;
    if (id && typeof(id) == 'string' && description && typeof(description) == 'string' && image && !Array.isArray(image)) {
        uploadImageForId(image, description, id, res.locals.orgName, (success, image) => {
            if (success && image) {
                return res.status(200).json({
                    message: 'Successfully uploaded a image to the report.',
                    code: 'Success',
                    data: {
                        image,
                    }
                });
            } else {
                return res.status(500).json({
                    message: 'Failed to upload this image to teh given report ID. Please check your information and try again.',
                    code: 'InternalError'
                });
            }
        })
    } else {
        return res.status(400).json({
            message: 'Please provide a body, with a image in it. VISOR only supports single Image upload.',
            code: 'IncompleteBody'
        })
    }
}

function getImages(req: Request, res: Response) {
    const { id } = req.query;
    if (id && typeof(id) == 'string') {
        getAllImagesForId(res.locals.orgName, id, (success, images) => {
            if (success && images) {
                return res.status(200).json({
                    message: 'Successfully uploaded a image to the report.',
                    code: 'Success',
                    data: {
                        images
                    }
                });
            } else {
                return res.status(500).json({
                    message: 'Failed to fetch images for this report.',
                    code: 'InternalError'
                });
            }
        })
    } else {
        return res.status(400).json({
            message: 'Please check, that your request has a "id" parameter to select the report.',
            code: 'IncompleteBody'
        })
    }
}

function deleteImage(req: Request, res: Response) {
    const { name } = req.query;
    if (name && typeof(name) == 'string') {
        deleteImageFromKey(name, (success) => {
            if (success) {
                return res.status(200).json({
                    message: 'Successfully deleted Image.',
                    code: 'Success'
                })
            } else {
                return res.status(500).json({
                    message: 'Could not find Image or there was an error while deleting the Image.',
                    code: 'InternalError'
                })
            }
        })
    } else {
        return res.status(400).json({
            message: 'Please check, that your request has a "name" body option to select the image.',
            code: 'IncompleteBody'
        })
    }
}

// TODO: Function: Change description
function updateImage(req: Request, res: Response) {
    const { name } = req.query;
    const { description } = req.body;
    if (description && typeof(description) == 'string' && name && typeof(name) == 'string') {
        updateDescriptionFromKey(name, description, (success) => {
            if (success) {
                return res.status(200).json({
                    message: 'Successfully update Image description.',
                    code: 'Success'
                })
            } else {
                return res.status(500).json({
                    message: 'Could not find Image or there was an error while updating the Image description.',
                    code: 'InternalError'
                })
            }
        })
    } else {
        return res.status(400).json({
            message: 'Please check, that your request has a "name" body option to select the image.',
            code: 'IncompleteBody'
        })
    }
}

function OMSimilarity(req: Request, res: Response) {
    const { oms, system, stellarObject, planetLevelObject } = req.body;
    if (typeof(oms) == 'object' && oms.length == 6 && typeof(system) == 'string' && typeof(stellarObject) == 'string') {
        const nav = { system, stellarObject, planetLevelObject };
        getSimilarReports(res.locals.orgName, oms, nav, (success, foundReports, similarReports) => {
            if (success) {
                if (foundReports && similarReports) {
                    return res.status(200).json({
                        message: 'There are reports with similar OM Markers on the same Moon / Planet.',
                        code: 'Warning',
                        similarReports
                    })
                } else {
                    return res.status(404).json({
                        message: 'No reports found with similar OMs.',
                        code: 'NotFound',
                    })
                }
            } else {
                return res.status(500).json({
                    message: 'The VISOR API could not find any reports on the specified Moon / Planet or there was some sort of Error.',
                    code: 'InternalError'
                })
            }
        })
    } else {
        return res.status(400).json({
            message: 'Please check, that your request has all oms, system and stellarObject (planetLevelObject: optional) in the body.',
            code: 'IncompleteBody'
        })
    }
}

export default {
    createVISOR,
    listVISORs,
    getVISOR,
    updateVISOR,
    approveVISOR,
    deleteVISOR,
    uploadImage,
    getImages,
    deleteImage,
    updateImage,
    OMSimilarity
}